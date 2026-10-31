import base64
from contextlib import closing
import difflib
import fnmatch
import hashlib
import json
import mimetypes
import os
import re
import sqlite3
import tarfile
import tempfile
import uuid
import zipfile
import zlib
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import quote, unquote, urljoin, urlsplit

import requests

from helper.functions import _version_sort_key

REGISTRY_HOST = "registry.npmjs.org"
GITHUB_API_HOST = "api.github.com"
GITHUB_ARCHIVE_HOST = "codeload.github.com"
MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
MAX_EXTRACTED_BYTES = 300 * 1024 * 1024
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_FILES = 20_000
MAX_METADATA_BYTES = 20 * 1024 * 1024
MAX_TEXT_DIFF_BYTES = 64 * 1024
MAX_DIFF_LINES = 120


class ScanError(Exception):
    """Raised when a package cannot be safely retrieved or analyzed."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _validate_url(url: str, allowed_hosts: Iterable[str]) -> None:
    parsed = urlsplit(url)
    try:
        valid_port = parsed.port in (None, 443)
    except ValueError:
        valid_port = False
    if parsed.scheme != "https" or parsed.hostname not in allowed_hosts or parsed.username or parsed.password or not valid_port:
        raise ScanError("A download URL did not match the scanner's HTTPS host policy.")


def _open_response(
    url: str,
    allowed_hosts: Iterable[str],
    headers: Optional[Dict[str, str]] = None,
) -> requests.Response:
    current_url = url
    for _ in range(4):
        _validate_url(current_url, allowed_hosts)
        try:
            response = requests.get(
                current_url,
                headers=headers,
                stream=True,
                timeout=(10, 45),
                allow_redirects=False,
            )
        except requests.RequestException as exc:
            raise ScanError(f"Unable to retrieve remote package data: {exc}") from exc

        if response.status_code in (301, 302, 303, 307, 308):
            location = response.headers.get("Location")
            response.close()
            if not location:
                raise ScanError("Remote server returned a redirect without a destination.")
            current_url = urljoin(current_url, location)
            continue
        return response
    raise ScanError("Remote server exceeded the redirect limit.")


def _read_limited_response(response: requests.Response, limit: int) -> bytes:
    try:
        content_length = response.headers.get("Content-Length")
        if content_length:
            if int(content_length) > limit:
                response.close()
                raise ScanError("Remote response exceeds the configured size limit.")
    except ValueError as exc:
        response.close()
        raise ScanError("Remote server returned an invalid content length.") from exc

    content = bytearray()
    try:
        for chunk in response.iter_content(chunk_size=64 * 1024):
            if not chunk:
                continue
            content.extend(chunk)
            if len(content) > limit:
                raise ScanError("Remote response exceeds the configured size limit.")
    except requests.RequestException as exc:
        raise ScanError(f"Remote response was interrupted: {exc}") from exc
    finally:
        response.close()
    return bytes(content)


def _fetch_json(url: str, allowed_hosts: Iterable[str]) -> Dict[str, Any]:
    response = _open_response(url, allowed_hosts, {"Accept": "application/json"})
    if response.status_code != 200:
        status = response.status_code
        response.close()
        raise ScanError(
            f"Remote metadata request failed with HTTP {status}.",
            status_code=404 if status == 404 else 502,
        )
    body = _read_limited_response(response, MAX_METADATA_BYTES)
    try:
        data = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ScanError("Remote server returned invalid JSON metadata.") from exc
    if not isinstance(data, dict):
        raise ScanError("Remote metadata had an unexpected format.")
    return data


def _registry_metadata(package_name: str) -> Dict[str, Any]:
    package_path = quote(package_name, safe="")
    url = f"https://{REGISTRY_HOST}/{package_path}"
    return _fetch_json(url, (REGISTRY_HOST,))


def _expected_digest(metadata: Dict[str, Any]) -> Tuple[Optional[str], Optional[bytes]]:
    dist = metadata.get("dist") or {}
    integrity = dist.get("integrity")
    if isinstance(integrity, str):
        for token in integrity.split():
            match = re.fullmatch(r"(sha512|sha1)-([A-Za-z0-9+/]+={0,2})(?:\?.*)?", token)
            if not match:
                continue
            algorithm, encoded_digest = match.groups()
            try:
                expected = base64.b64decode(encoded_digest, validate=True)
            except ValueError:
                continue
            if len(expected) == hashlib.new(algorithm).digest_size:
                return algorithm, expected

    shasum = dist.get("shasum")
    if isinstance(shasum, str) and re.fullmatch(r"[a-fA-F0-9]{40}", shasum):
        return "sha1", bytes.fromhex(shasum)
    return None, None


def _download_archive(
    url: str,
    destination: Path,
    expected_algorithm: Optional[str],
    expected_digest: Optional[bytes],
    expected_shasum: Optional[str],
) -> Dict[str, Any]:
    response = _open_response(url, (REGISTRY_HOST,))
    if response.status_code != 200:
        status = response.status_code
        response.close()
        raise ScanError(f"npm tarball download failed with HTTP {status}.")

    content_length = response.headers.get("Content-Length")
    if content_length:
        try:
            if int(content_length) > MAX_ARCHIVE_BYTES:
                response.close()
                raise ScanError("npm tarball exceeds the configured download size limit.")
        except ValueError as exc:
            response.close()
            raise ScanError("npm registry returned an invalid tarball content length.") from exc

    sha256 = hashlib.sha256()
    sha512 = hashlib.sha512()
    sha1 = hashlib.sha1()
    size = 0
    try:
        with destination.open("xb") as archive_file:
            for chunk in response.iter_content(chunk_size=64 * 1024):
                if not chunk:
                    continue
                size += len(chunk)
                if size > MAX_ARCHIVE_BYTES:
                    raise ScanError("npm tarball exceeds the configured download size limit.")
                archive_file.write(chunk)
                sha256.update(chunk)
                sha512.update(chunk)
                sha1.update(chunk)
    except requests.RequestException as exc:
        raise ScanError(f"npm tarball download was interrupted: {exc}") from exc
    except OSError as exc:
        raise ScanError(f"Unable to store the downloaded npm tarball: {exc}") from exc
    finally:
        response.close()

    actual_digests = {"sha512": sha512.digest(), "sha1": sha1.digest()}
    if expected_algorithm is None or expected_digest is None:
        raise ScanError("npm metadata did not include a supported integrity digest.")
    verified = actual_digests[expected_algorithm] == expected_digest
    if expected_shasum is not None:
        if not isinstance(expected_shasum, str) or not re.fullmatch(r"[a-fA-F0-9]{40}", expected_shasum):
            raise ScanError("npm registry returned a malformed SHA-1 shasum.")
        if sha1.hexdigest().lower() != expected_shasum.lower():
            raise ScanError("Downloaded npm tarball does not match the registry SHA-1 shasum.")
    if not verified:
        raise ScanError("Downloaded npm tarball does not match the registry integrity digest.")
    return {
        "size": size,
        "sha256": sha256.hexdigest(),
        "sha1": sha1.hexdigest(),
        "verified": verified,
        "algorithm": expected_algorithm,
        "integrity": f"{expected_algorithm}-{base64.b64encode(expected_digest).decode('ascii')}",
    }


def _safe_member_parts(member_name: str) -> Tuple[str, ...]:
    if not member_name or "\\" in member_name or member_name.startswith("/"):
        raise ScanError("Archive contains an unsafe absolute or Windows-style path.")
    parts = tuple(part for part in PurePosixPath(member_name).parts if part not in ("", "."))
    if not parts or any(part == ".." for part in parts):
        raise ScanError("Archive contains a path traversal entry.")
    for part in parts:
        if ":" in part or part.endswith((".", " ")):
            raise ScanError("Archive contains a Windows-style or unsafe path component.")
        windows_name = part.split(".", 1)[0].upper()
        if windows_name in {"CON", "PRN", "AUX", "NUL", "CLOCK$"} or re.fullmatch(
            r"(?:COM|LPT)[1-9]", windows_name
        ):
            raise ScanError("Archive contains a reserved Windows device filename.")
    return parts


def _normalize_archive_path(
    parts: Tuple[str, ...], strip_prefix: Optional[str], strip_common_root: Optional[str]
) -> str:
    if strip_prefix and parts[0] == strip_prefix:
        parts = parts[1:]
    if strip_common_root and parts[0] == strip_common_root:
        parts = parts[1:]
    return PurePosixPath(*parts).as_posix() if parts else ""


def _write_member(
    source: Any,
    root: Path,
    relative_path: str,
    declared_size: int,
    totals: Dict[str, int],
) -> None:
    if declared_size < 0 or declared_size > MAX_FILE_BYTES:
        raise ScanError("Archive contains a file larger than the configured per-file limit.")
    totals["files"] += 1
    totals["declared_bytes"] += declared_size
    if totals["files"] > MAX_FILES or totals["declared_bytes"] > MAX_EXTRACTED_BYTES:
        raise ScanError("Archive exceeds the configured extraction limits.")

    target = root.joinpath(*PurePosixPath(relative_path).parts)
    if not target.resolve().is_relative_to(root.resolve()):
        raise ScanError("Archive entry resolves outside the extraction directory.")
    target.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    try:
        with target.open("xb") as output:
            while True:
                chunk = source.read(64 * 1024)
                if not chunk:
                    break
                written += len(chunk)
                totals["actual_bytes"] += len(chunk)
                if written > declared_size or written > MAX_FILE_BYTES:
                    raise ScanError("Archive entry exceeded its declared or configured size.")
                if totals["actual_bytes"] > MAX_EXTRACTED_BYTES:
                    raise ScanError("Archive exceeds the configured extraction limits.")
                output.write(chunk)
    except OSError as exc:
        raise ScanError(f"Unable to extract an archive entry: {exc}") from exc
    if written != declared_size:
        raise ScanError("Archive entry size did not match its declared size.")


def _extract_tar(archive_path: Path, destination: Path, strip_package: bool) -> Dict[str, int]:
    try:
        archive = tarfile.open(archive_path, mode="r:gz")
    except (tarfile.TarError, OSError, EOFError, zlib.error) as exc:
        raise ScanError("Downloaded npm artifact is not a valid gzip tar archive.") from exc

    totals = {"files": 0, "declared_bytes": 0, "actual_bytes": 0}
    seen = set()
    try:
        with archive:
            members = archive.getmembers()
            if len(members) > MAX_FILES * 2:
                raise ScanError("Archive contains too many entries.")
            for member in members:
                parts = _safe_member_parts(member.name)
                if member.isdir():
                    continue
                if not member.isfile():
                    raise ScanError("Archive contains a link, device, or unsupported entry type.")
                relative_path = _normalize_archive_path(
                    parts, "package" if strip_package else None, None
                )
                if not relative_path:
                    raise ScanError("Archive contains a file without a package-relative path.")
                if relative_path in seen:
                    raise ScanError("Archive contains duplicate normalized file paths.")
                seen.add(relative_path)
                source = archive.extractfile(member)
                if source is None:
                    raise ScanError("Archive contained an unreadable regular file.")
                with source:
                    _write_member(source, destination, relative_path, member.size, totals)
    except (tarfile.TarError, OSError) as exc:
        raise ScanError(f"Unable to safely extract npm tarball: {exc}") from exc
    return totals


def _extract_zip(archive_path: Path, destination: Path) -> Dict[str, int]:
    try:
        archive = zipfile.ZipFile(archive_path)
    except (zipfile.BadZipFile, OSError) as exc:
        raise ScanError("GitHub source archive is not a valid zip file.") from exc

    totals = {"files": 0, "declared_bytes": 0, "actual_bytes": 0}
    seen = set()
    try:
        with archive:
            members = archive.infolist()
            if len(members) > MAX_FILES * 2:
                raise ScanError("Source archive contains too many entries.")
            raw_paths = [(member, _safe_member_parts(member.filename)) for member in members]
            roots = {parts[0] for _, parts in raw_paths if len(parts) > 1}
            has_root_files = any(
                len(parts) == 1 and not member.is_dir() for member, parts in raw_paths
            )
            strip_common_root = next(iter(roots)) if len(roots) == 1 and not has_root_files else None

            for member, parts in raw_paths:
                if member.is_dir():
                    continue
                mode = (member.external_attr >> 16) & 0xFFFF
                file_type = mode & 0o170000
                if file_type not in (0, 0o100000) or member.flag_bits & 0x1:
                    raise ScanError("Source archive contains a link, special, or encrypted entry.")
                relative_path = _normalize_archive_path(parts, None, strip_common_root)
                if not relative_path:
                    raise ScanError("Source archive contains a file without a relative path.")
                if relative_path in seen:
                    raise ScanError("Source archive contains duplicate normalized file paths.")
                seen.add(relative_path)
                with archive.open(member, "r") as source:
                    _write_member(source, destination, relative_path, member.file_size, totals)
    except (zipfile.BadZipFile, OSError, RuntimeError, zlib.error) as exc:
        raise ScanError(f"Unable to safely extract GitHub source archive: {exc}") from exc
    return totals


def _build_manifest(root: Path, artifact_id: str, source_commit: Optional[str]) -> Dict[str, Any]:
    files = []
    for directory, subdirectories, filenames in os.walk(root, followlinks=False):
        subdirectories[:] = sorted(
            name for name in subdirectories if not (Path(directory) / name).is_symlink()
        )
        for filename in filenames:
            path = Path(directory) / filename
            if not path.is_file() or path.is_symlink():
                continue
            relative_path = path.relative_to(root).as_posix()
            digest = hashlib.sha256()
            size = 0
            with path.open("rb") as file_handle:
                for chunk in iter(lambda: file_handle.read(64 * 1024), b""):
                    digest.update(chunk)
                    size += len(chunk)
            mime_type, _ = mimetypes.guess_type(relative_path)
            if mime_type is None and not Path(relative_path).suffix:
                with path.open("rb") as file_handle:
                    sample = file_handle.read(4096)
                try:
                    sample.decode("utf-8")
                    mime_type = "text/plain"
                except UnicodeDecodeError:
                    mime_type = "application/octet-stream"
            files.append(
                {
                    "path": relative_path,
                    "size": size,
                    "hash": digest.hexdigest(),
                    "type": mime_type or Path(relative_path).suffix.lstrip(".") or "binary",
                }
            )
    files.sort(key=lambda item: item["path"])
    return {
        "artifactId": artifact_id,
        "sourceCommit": source_commit,
        "files": files,
    }


def _repository_url(metadata: Dict[str, Any]) -> Tuple[Optional[str], Optional[Tuple[str, str]]]:
    repository = metadata.get("repository")
    if isinstance(repository, dict):
        repository = repository.get("url")
    if not isinstance(repository, str) or not repository.strip():
        return None, None
    value = repository.strip()
    if value.startswith("github:"):
        value = "https://github.com/" + value[len("github:") :]
    elif value.startswith("git@github.com:"):
        value = "https://github.com/" + value[len("git@github.com:") :]
    value = re.sub(r"^git\+", "", value)
    if value.startswith("ssh://git@github.com/"):
        value = "https://github.com/" + value[len("ssh://git@github.com/") :]
    if value.endswith(".git"):
        value = value[:-4]

    try:
        parsed = urlsplit(value)
        valid_port = parsed.port in (None, 443)
    except ValueError:
        return None, None
    if parsed.scheme != "https" or parsed.hostname != "github.com" or not valid_port:
        return None, None
    segments = [unquote(segment) for segment in parsed.path.strip("/").split("/") if segment]
    if len(segments) < 2:
        return None, None
    owner, repository_name = segments[:2]
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", owner) or not re.fullmatch(
        r"[A-Za-z0-9_.-]+", repository_name
    ):
        return None, None
    return f"https://github.com/{owner}/{repository_name}", (owner, repository_name)


def _repository_directory(metadata: Dict[str, Any]) -> Optional[str]:
    repository = metadata.get("repository")
    if not isinstance(repository, dict):
        return None
    directory = repository.get("directory")
    if not isinstance(directory, str) or not directory.strip():
        return None
    parts = _safe_member_parts(directory.strip())
    return PurePosixPath(*parts).as_posix()


def _resolve_source(
    repository: Tuple[str, str], version_metadata: Dict[str, Any], version: str
) -> Tuple[Optional[str], Optional[str], bool, Optional[str]]:
    owner, repository_name = repository
    git_head = version_metadata.get("gitHead")
    if isinstance(git_head, str) and re.fullmatch(r"[a-fA-F0-9]{40}", git_head):
        return git_head.lower(), f"gitHead:{git_head.lower()}", True, None

    for tag in (f"v{version}", version):
        url = (
            f"https://{GITHUB_API_HOST}/repos/{quote(owner, safe='')}/"
            f"{quote(repository_name, safe='')}/git/ref/tags/{quote(tag, safe='')}"
        )
        try:
            response = _open_response(url, (GITHUB_API_HOST,), {"Accept": "application/vnd.github+json"})
        except ScanError as exc:
            return None, tag, False, str(exc)
        if response.status_code == 404:
            response.close()
            continue
        if response.status_code != 200:
            status = response.status_code
            response.close()
            return None, tag, False, f"GitHub could not resolve source tag (HTTP {status})."
        try:
            payload = json.loads(_read_limited_response(response, 1024 * 1024))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            return None, tag, False, "GitHub returned invalid commit metadata."
        ref_object = payload.get("object") if isinstance(payload, dict) else None
        if not isinstance(ref_object, dict):
            continue

        for _ in range(3):
            commit = ref_object.get("sha")
            object_type = ref_object.get("type")
            if object_type == "commit" and isinstance(commit, str) and re.fullmatch(
                r"[a-fA-F0-9]{40}", commit
            ):
                return commit.lower(), tag, False, None
            if object_type != "tag" or not isinstance(commit, str) or not re.fullmatch(
                r"[a-fA-F0-9]{40}", commit
            ):
                break
            tag_url = (
                f"https://{GITHUB_API_HOST}/repos/{quote(owner, safe='')}/"
                f"{quote(repository_name, safe='')}/git/tags/{quote(commit, safe='')}"
            )
            try:
                tag_response = _open_response(
                    tag_url,
                    (GITHUB_API_HOST,),
                    {"Accept": "application/vnd.github+json"},
                )
            except ScanError as exc:
                return None, tag, False, str(exc)
            if tag_response.status_code != 200:
                status = tag_response.status_code
                tag_response.close()
                return None, tag, False, f"GitHub could not resolve the annotated version tag (HTTP {status})."
            try:
                tag_payload = json.loads(_read_limited_response(tag_response, 1024 * 1024))
            except (UnicodeDecodeError, json.JSONDecodeError):
                return None, tag, False, "GitHub returned invalid annotated tag metadata."
            ref_object = tag_payload.get("object") if isinstance(tag_payload, dict) else None
            if not isinstance(ref_object, dict):
                break
    return None, f"v{version}", False, "No exact version tag or npm gitHead was available."


def _download_source_archive(
    owner: str, repository_name: str, commit: str, destination: Path
) -> None:
    url = f"https://{GITHUB_ARCHIVE_HOST}/{quote(owner, safe='')}/{quote(repository_name, safe='')}/zip/{quote(commit, safe='')}"
    response = _open_response(url, (GITHUB_ARCHIVE_HOST,))
    if response.status_code != 200:
        status = response.status_code
        response.close()
        raise ScanError(f"GitHub source archive download failed with HTTP {status}.")

    content_length = response.headers.get("Content-Length")
    if content_length:
        try:
            if int(content_length) > MAX_ARCHIVE_BYTES:
                response.close()
                raise ScanError("GitHub source archive exceeds the download size limit.")
        except ValueError as exc:
            response.close()
            raise ScanError("GitHub returned an invalid source archive content length.") from exc

    size = 0
    try:
        with destination.open("xb") as archive_file:
            for chunk in response.iter_content(chunk_size=64 * 1024):
                if not chunk:
                    continue
                size += len(chunk)
                if size > MAX_ARCHIVE_BYTES:
                    raise ScanError("GitHub source archive exceeds the download size limit.")
                archive_file.write(chunk)
    except requests.RequestException as exc:
        raise ScanError(f"GitHub source archive download was interrupted: {exc}") from exc
    except OSError as exc:
        raise ScanError(f"Unable to store GitHub source archive: {exc}") from exc
    finally:
        response.close()


def _compare_manifests(
    source_manifest: Dict[str, Any],
    package_manifest: Dict[str, Any],
    source_root: Optional[Path],
    package_root: Path,
) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    if source_root is None:
        return [], {"added": 0, "removed": 0, "modified": 0, "identical": 0}

    source_files = {item["path"]: item for item in source_manifest.get("files", [])}
    package_files = {item["path"]: item for item in package_manifest.get("files", [])}
    differences = []
    counts = {"added": 0, "removed": 0, "modified": 0, "identical": 0}

    for path in sorted(source_files.keys() | package_files.keys()):
        source_item = source_files.get(path)
        package_item = package_files.get(path)
        if source_item is None:
            status = "added"
        elif package_item is None:
            status = "removed"
        elif source_item["hash"] != package_item["hash"]:
            status = "modified"
        else:
            counts["identical"] += 1
            continue

        counts[status] += 1
        difference: Dict[str, Any] = {"path": path, "status": status}
        if status == "modified" and source_root is not None:
            source_path = source_root.joinpath(*PurePosixPath(path).parts)
            package_path = package_root.joinpath(*PurePosixPath(path).parts)
            difference["textDiff"] = _text_diff(source_path, package_path)
        else:
            difference["textDiff"] = None
        differences.append(difference)
    return differences, counts


def _text_diff(source_path: Path, package_path: Path) -> Optional[str]:
    try:
        source_bytes = source_path.read_bytes()
        package_bytes = package_path.read_bytes()
    except OSError:
        return None
    if len(source_bytes) > MAX_TEXT_DIFF_BYTES or len(package_bytes) > MAX_TEXT_DIFF_BYTES:
        return None
    if b"\x00" in source_bytes or b"\x00" in package_bytes:
        return None
    try:
        source_text = source_bytes.decode("utf-8").splitlines()
        package_text = package_bytes.decode("utf-8").splitlines()
    except UnicodeDecodeError:
        return None
    lines = list(
        difflib.unified_diff(
            source_text,
            package_text,
            fromfile="source",
            tofile="published",
            lineterm="",
        )
    )
    if len(lines) > MAX_DIFF_LINES:
        lines = lines[:MAX_DIFF_LINES] + ["... diff truncated ..."]
    return "\n".join(lines)


def _build_analysis(
    source_root: Optional[Path],
    differences: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, str]], Dict[str, Any]]:
    package_data: Dict[str, Any] = {}
    if source_root is not None:
        package_json = source_root / "package.json"
        if package_json.is_file():
            try:
                loaded_package_data = json.loads(package_json.read_text(encoding="utf-8"))
            except (OSError, UnicodeDecodeError, json.JSONDecodeError):
                loaded_package_data = {}
            if isinstance(loaded_package_data, dict):
                package_data = loaded_package_data

    files_allowlist = package_data.get("files", [])
    if not isinstance(files_allowlist, list):
        files_allowlist = []
    files_allowlist = [pattern for pattern in files_allowlist if isinstance(pattern, str)]
    def expected_source_exclusion(path: str) -> Optional[str]:
        normalized_path = path.lstrip("./")
        if files_allowlist:
            is_included = any(
                fnmatch.fnmatchcase(normalized_path, pattern.lstrip("./"))
                or normalized_path.startswith(pattern.strip("./") + "/")
                for pattern in files_allowlist
            )
            if not is_included:
                return "Source path is outside the package.json files allowlist."

        parts = PurePosixPath(normalized_path).parts
        filename = parts[-1].lower() if parts else ""
        if any(part.lower() in {"test", "tests", "__tests__", "fixtures", "docs", "examples", "benchmarks"} for part in parts):
            return "Test, documentation, example, or benchmark source is commonly excluded from published packages."
        if parts and parts[0].startswith("."):
            return "Repository metadata and hidden configuration are commonly excluded from npm packages."
        if filename in {
            ".npmignore",
            ".gitignore",
            ".travis.yml",
            "contributing.md",
            "code_of_conduct.md",
            "tsconfig.json",
        } or re.search(r"(?:^|/)[^/]+\.config\.[^/]+$", normalized_path, re.I):
            return "Repository or build configuration is commonly excluded from npm packages."
        return None

    artifacts: List[Dict[str, str]] = []
    patterns = (
        (re.compile(r"\.d\.(?:ts|mts|cts)$", re.I), "declaration", "Generated TypeScript declaration output."),
        (re.compile(r"\.map$", re.I), "source-map", "Source maps are commonly emitted by build tooling."),
        (re.compile(r"(?:\.min\.)[^/]+$", re.I), "minified", "Minified output is commonly generated by bundlers."),
        (re.compile(r"(^|/)(?:dist|build|lib|out|coverage)/", re.I), "build-output", "File is under a conventional generated-output directory."),
        (re.compile(r"\.wasm$|\.node$", re.I), "platform-binary", "File is a WebAssembly or native platform artifact."),
        (re.compile(r"(^|/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$", re.I), "generated-metadata", "Dependency lockfile or generated package metadata."),
    )
    for difference in differences:
        path = difference["path"]
        exclusion_reason = (
            expected_source_exclusion(path)
            if difference.get("status") == "removed"
            else None
        )
        match = next((entry for entry in patterns if entry[0].search(path)), None)
        if exclusion_reason:
            kind, reason = "expected-exclusion", exclusion_reason
        elif match:
            kind, reason = match[1], match[2]
        else:
            kind, reason = "unexplained", "No build-output pattern or inspected build configuration explains this difference."
        artifacts.append({"path": path, "kind": kind, "reason": reason})

    build_configuration: Dict[str, Any] = {
        "scripts": {},
        "tools": [],
        "generatedDirectories": [],
        "configFiles": [],
        "filesAllowlist": files_allowlist,
    }
    if source_root is not None:
        scripts = package_data.get("scripts", {})
        dependencies = package_data.get("dependencies") or {}
        dev_dependencies = package_data.get("devDependencies") or {}
        if not isinstance(dependencies, dict):
            dependencies = {}
        if not isinstance(dev_dependencies, dict):
            dev_dependencies = {}
        dependencies = {**dependencies, **dev_dependencies}
        build_configuration["scripts"] = {
            name: command
            for name, command in scripts.items()
            if name in {"build", "prepare", "prepack", "postinstall"}
            and isinstance(command, str)
        } if isinstance(scripts, dict) else {}
        build_configuration["tools"] = sorted(
            tool
            for tool in ("typescript", "webpack", "rollup", "vite", "esbuild", "babel", "tsup")
            if tool in dependencies
        )
        for config_name in ("tsconfig.json", "webpack.config.js", "rollup.config.js", "vite.config.js", "vite.config.ts"):
            config_path = source_root / config_name
            if not config_path.is_file():
                continue
            build_configuration["configFiles"].append(config_name)
            try:
                config_text = config_path.read_text(encoding="utf-8")[:256 * 1024]
                config = json.loads(config_text) if config_name == "tsconfig.json" else {}
            except (OSError, UnicodeDecodeError, json.JSONDecodeError):
                config_text = ""
                config = {}
            compiler_options = config.get("compilerOptions", {}) if isinstance(config, dict) else {}
            out_dir = compiler_options.get("outDir") if isinstance(compiler_options, dict) else None
            if not isinstance(out_dir, str):
                output_match = re.search(
                    r"(?:outDir|output\s*:\s*\{[^}]{0,800}?path)\s*:\s*['\"]([^'\"]+)",
                    config_text,
                    re.S,
                )
                out_dir = output_match.group(1) if output_match else None
            if isinstance(out_dir, str):
                build_configuration["generatedDirectories"].append(out_dir)
    build_configuration["generatedDirectories"] = sorted(set(build_configuration["generatedDirectories"]))
    build_configuration["configFiles"] = sorted(set(build_configuration["configFiles"]))
    return artifacts, build_configuration


SECURITY_RULES = (
    (
        "dynamic-evaluation",
        re.compile(r"\beval\s*\(|\bnew\s+Function\s*\("),
        "MED",
        "Dynamic code evaluation construct found; review the surrounding code.",
    ),
    (
        "process-execution",
        re.compile(r"(?:child_process|execSync|spawnSync|execFileSync)\b"),
        "MED",
        "Process-execution API reference found; package code was not executed.",
    ),
    (
        "credential-environment-access",
        re.compile(r"process\.env\.[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY)\b", re.I),
        "MED",
        "Code references a credential-like environment variable.",
    ),
    (
        "encoded-payload",
        re.compile(r"\b(?:atob\s*\(|Buffer\.from\s*\([^,]+,\s*['\"]base64['\"]\))"),
        "LOW",
        "Base64 decoding construct found; this is a review signal, not proof of malicious behavior.",
    ),
)


def _security_findings(
    package_root: Path,
    package_metadata: Dict[str, Any],
    differences: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    findings = []
    candidate_paths = {
        item["path"]
        for item in differences
        if item["status"] in ("added", "modified")
        and Path(item["path"]).suffix.lower() in (".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx")
    }
    if not candidate_paths:
        for directory, _, filenames in os.walk(package_root, followlinks=False):
            for filename in filenames:
                relative_path = (Path(directory) / filename).relative_to(package_root).as_posix()
                if Path(relative_path).suffix.lower() in (".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx"):
                    candidate_paths.add(relative_path)
    for relative_path in sorted(candidate_paths):
        file_path = package_root.joinpath(*PurePosixPath(relative_path).parts)
        try:
            if file_path.stat().st_size > 512 * 1024:
                continue
            source = file_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for rule, pattern, severity, description in SECURITY_RULES:
            match = pattern.search(source)
            if match:
                findings.append(
                    {
                        "severity": severity,
                        "rule": rule,
                        "file": relative_path,
                        "evidence": match.group(0)[:120],
                        "description": description,
                        "confidence": "low" if severity == "LOW" else "medium",
                    }
                )

    scripts = package_metadata.get("scripts")
    if isinstance(scripts, dict):
        for name in ("preinstall", "install", "postinstall"):
            command = scripts.get(name)
            if isinstance(command, str):
                findings.append(
                    {
                        "severity": "MED",
                        "rule": "install-lifecycle-script",
                        "file": "package.json",
                        "evidence": f"{name}: {command[:120]}",
                        "description": "An npm install lifecycle script is declared; the scanner did not execute it.",
                        "confidence": "medium",
                    }
                )
    return findings


def _risk_score(
    integrity_verified: bool,
    source_resolved: bool,
    exact_source_revision: bool,
    provenance_present: bool,
    artifacts: List[Dict[str, str]],
    security: List[Dict[str, Any]],
) -> Dict[str, Any]:
    score = 0
    notes = []
    if not integrity_verified:
        score += 40
        notes.append("The published archive integrity could not be verified.")
    else:
        notes.append("The published archive matches the npm registry integrity digest.")
    if not source_resolved:
        score += 20
        notes.append("Source code was unavailable, so source-to-package comparison could not be completed.")
    elif not exact_source_revision:
        score += 8
        notes.append("Source was resolved from a version tag; the npm metadata did not provide an exact gitHead.")
    else:
        notes.append("The source archive was pinned to the npm gitHead commit.")
    if not provenance_present:
        score += 5
        notes.append("No provenance attestation was available for cryptographic verification.")

    unexplained = sum(1 for artifact in artifacts if artifact["kind"] == "unexplained")
    if unexplained:
        contribution = min(32, unexplained * 8)
        score += contribution
        notes.append(f"{unexplained} file difference(s) were not explained by build-output heuristics (+{contribution}).")
    security_contribution = min(
        24,
        sum(8 if item["severity"] == "MED" else 3 for item in security),
    )
    if security_contribution:
        score += security_contribution
        notes.append(f"Static review signals contributed {security_contribution} points; each requires manual review.")
    score = min(100, score)
    level = "SAFE" if score < 25 else "WARN" if score < 60 else "CRITICAL"
    return {"score": score, "level": level, "notes": notes, "model": "killchain-risk-v1"}


def _database_path() -> Path:
    configured = os.environ.get("KILLCHAIN_DB_PATH")
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parents[1] / "data" / "scans.sqlite3"


def _connect_database() -> sqlite3.Connection:
    path = _database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            score INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            report_json TEXT NOT NULL
        )
        """
    )
    connection.commit()
    return connection


def save_scan(result: Dict[str, Any]) -> None:
    with closing(_connect_database()) as connection:
        connection.execute(
            """
            INSERT INTO scans (id, name, version, score, timestamp, report_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                result["id"],
                result["pkg"]["name"],
                result["pkg"]["version"],
                result["risk"]["score"],
                result["timestamp"],
                json.dumps(result, separators=(",", ":")),
            ),
        )
        connection.commit()


def get_scan(scan_id: str) -> Optional[Dict[str, Any]]:
    with closing(_connect_database()) as connection:
        row = connection.execute(
            "SELECT report_json FROM scans WHERE id = ?", (scan_id,)
        ).fetchone()
    return json.loads(row["report_json"]) if row else None


def list_scans() -> List[Dict[str, Any]]:
    with closing(_connect_database()) as connection:
        rows = connection.execute(
            "SELECT id, name, version, score FROM scans ORDER BY timestamp DESC LIMIT 100"
        ).fetchall()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "version": row["version"],
            "score": row["score"],
        }
        for row in rows
    ]


def run_scan(package_name: str, requested_version: str) -> Dict[str, Any]:
    metadata = _registry_metadata(package_name)
    versions = metadata.get("versions")
    dist_tags = metadata.get("dist-tags") or {}
    if not isinstance(dist_tags, dict):
        dist_tags = {}
    if not isinstance(versions, dict) or not versions:
        raise ScanError(
            f"npm has no published versions for {package_name}.",
            status_code=404,
        )
    version = dist_tags.get("latest") if requested_version == "latest" else requested_version
    if not isinstance(version, str) or version not in versions:
        raise ScanError(
            f"Version '{requested_version}' was not found for {package_name}.",
            status_code=404,
        )

    version_metadata = versions[version]
    if not isinstance(version_metadata, dict):
        raise ScanError("npm returned malformed version metadata.")
    dist = version_metadata.get("dist")
    if not isinstance(dist, dict) or not isinstance(dist.get("tarball"), str):
        raise ScanError("npm version metadata did not include a tarball URL.")
    integrity_algorithm, integrity_digest = _expected_digest(version_metadata)
    source_url, repository = _repository_url(version_metadata) if version_metadata.get("repository") else (None, None)
    if repository is None and metadata.get("repository"):
        source_url, repository = _repository_url(metadata)
    source_directory_error = None
    try:
        source_directory = _repository_directory(version_metadata) or _repository_directory(metadata)
    except ScanError as exc:
        source_directory = None
        source_directory_error = str(exc)

    scan_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    source_error = None
    source_commit = None
    source_tag = f"v{version}"
    exact_source_revision = False
    source_root: Optional[Path] = None
    source_manifest: Dict[str, Any] = {"artifactId": None, "sourceCommit": None, "files": []}

    with tempfile.TemporaryDirectory(prefix="killchain-") as workdir:
        root = Path(workdir)
        package_root = root / "published"
        package_root.mkdir()
        package_archive = root / "package.tgz"
        artifact = _download_archive(
            dist["tarball"],
            package_archive,
            integrity_algorithm,
            integrity_digest,
            dist.get("shasum"),
        )
        extraction = _extract_tar(package_archive, package_root, strip_package=True)
        package_manifest = _build_manifest(package_root, artifact["sha256"], None)

        source_resolved = False
        if repository is None:
            source_error = "No supported GitHub source repository was present in npm metadata."
        elif source_directory_error:
            source_error = source_directory_error
        else:
            try:
                source_commit, source_tag, exact_source_revision, source_error = _resolve_source(
                    repository, version_metadata, version
                )
                if source_commit:
                    source_archive_root = root / "source"
                    source_archive_root.mkdir()
                    source_archive = root / "source.zip"
                    _download_source_archive(repository[0], repository[1], source_commit, source_archive)
                    _extract_zip(source_archive, source_archive_root)
                    source_root = (
                        source_archive_root.joinpath(*PurePosixPath(source_directory).parts)
                        if source_directory
                        else source_archive_root
                    )
                    if not source_root.is_dir():
                        raise ScanError("The package repository directory was not present in the source archive.")
                    source_archive_hash = hashlib.sha256()
                    with source_archive.open("rb") as source_archive_file:
                        for chunk in iter(lambda: source_archive_file.read(64 * 1024), b""):
                            source_archive_hash.update(chunk)
                    source_manifest = _build_manifest(
                        source_root, source_archive_hash.hexdigest(), source_commit
                    )
                    source_resolved = True
                else:
                    source_root = None
            except ScanError as exc:
                source_error = str(exc)
                source_root = None
                source_commit = None
                exact_source_revision = False

        package_manifest["sourceCommit"] = source_commit
        differences, comparison_counts = _compare_manifests(
            source_manifest, package_manifest, source_root, package_root
        )
        artifacts, build_configuration = _build_analysis(source_root, differences)
        security = _security_findings(package_root, version_metadata, differences)

        provenance_metadata = dist.get("attestations")
        provenance_present = bool(provenance_metadata)
        provenance = {
            "signed": provenance_present,
            "verified": False,
            "status": "available-unverified" if provenance_present else "unavailable",
            "note": (
                "Attestation metadata exists, but signature and source claims were not cryptographically verified."
                if provenance_present
                else "No supported npm provenance attestation was present in the retrieved metadata."
            ),
        }
        risk = _risk_score(
            artifact["verified"],
            source_resolved,
            exact_source_revision,
            provenance_present,
            artifacts,
            security,
        )
        diff_summary = (
            f"{comparison_counts['added']} package-only, {comparison_counts['removed']} source-only, "
            f"{comparison_counts['modified']} modified, and {comparison_counts['identical']} identical files."
        )
        ai_explanation = {
            "summary": (
                "This report was generated by deterministic checks; no AI model was called. "
                f"{diff_summary}"
            ),
            "points": [
                f"npm archive SHA-256: {artifact['sha256']}",
                f"Source revision: {source_commit or 'unavailable'}",
                f"Source retrieval: {source_error or 'completed'}",
                "Security signals are static review indicators and are not proof of malicious intent.",
            ],
            "recommendation": (
                "Review all flagged file differences and static signals before relying on this release."
                if risk["level"] != "SAFE"
                else "The available integrity and comparison checks did not identify a high-risk signal; continue normal review."
            ),
        }
        return {
            "id": scan_id,
            "timestamp": timestamp,
            "pkg": {
                "name": metadata.get("name", package_name),
                "version": version,
                "tarballUrl": dist["tarball"],
                "shasum": artifact["sha1"],
                "shasumVerified": dist.get("shasum") is not None,
                "integrity": artifact["integrity"],
                "integrity": artifact["integrity"],
                "artifactId": artifact["sha256"],
                "verified": artifact["verified"],
            },
            "extraction": {
                "safe": True,
                "filesCount": extraction["files"],
                "totalBytes": extraction["actual_bytes"],
            },
            "source": {
                "repoUrl": source_url or "",
                "commit": source_commit or "",
                "tag": source_tag or "",
                "match": exact_source_revision,
                "error": source_error,
                "directory": source_directory,
            },
            "manifest": package_manifest["files"],
            "publishedManifest": package_manifest,
            "sourceManifest": source_manifest,
            "comparison": {
                "summary": comparison_counts,
                "identical": comparison_counts["identical"],
            },
            "diff": differences,
            "artifacts": artifacts,
            "buildAnalysis": build_configuration,
            "security": security,
            "provenance": provenance,
            "risk": risk,
            "aiExplanation": ai_explanation,
        }
