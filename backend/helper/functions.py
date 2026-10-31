import re
import urllib.parse
from typing import Iterable, Optional, Tuple

import requests

SEMVER_RE = re.compile(
    r"^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$"
)


def _version_sort_key(version: str) -> Tuple[int, int, int, int, str]:
    match = SEMVER_RE.match(version.strip())
    if not match:
        return (0, 0, 0, 0, "")

    major, minor, patch, prerelease, _ = match.groups()
    prerelease_exists = 0 if prerelease is None else 1
    return (int(major), int(minor), int(patch), prerelease_exists, prerelease or "")


def is_stable_version(version: str) -> bool:
    parsed = version.strip()
    if not parsed:
        return False
    return "-" not in parsed.split("+", 1)[0]


def get_base_version(target_version: str, version_list: Iterable[str]) -> Optional[str]:
    if not target_version:
        return None

    cleaned_versions = [v.strip() for v in version_list if isinstance(v, str) and v.strip()]
    if not cleaned_versions:
        return None

    stable_versions = [v for v in cleaned_versions if is_stable_version(v)]
    if not stable_versions:
        return None

    stable_versions_sorted = sorted(stable_versions, key=_version_sort_key)
    target_key = _version_sort_key(target_version)

    previous = [v for v in stable_versions_sorted if _version_sort_key(v) < target_key]
    return previous[-1] if previous else None


def connect_to_npm(package_name: str):
    """Connect to the npm registry and return the JSON metadata payload."""
    encoded = urllib.parse.quote(package_name, safe="")
    registry_url = f"https://registry.npmjs.org/{encoded}"
    headers = {"Accept": "application/vnd.npm.install-v1+json"}

    try:
        response = requests.get(
            registry_url,
            headers=headers,
            timeout=(10, 30),
            allow_redirects=False,
        )
    except requests.RequestException as exc:
        return {"error": f"Unable to reach the npm registry for {package_name}.", "details": str(exc)}

    if response.status_code != 200:
        return {
            "error": f"npm registry request failed for {package_name}.",
            "status_code": response.status_code,
            "details": response.text[:300],
        }

    try:
        return response.json()
    except ValueError:
        return {"error": f"npm registry returned invalid JSON for {package_name}.", "status_code": response.status_code}


def fetch_package_metadata(package_name: str, version: str):
    """Fetch package metadata for a requested package and version."""
    if not package_name or not package_name.strip():
        return {"error": "Package name is required."}
    if not version or not version.strip():
        return {"error": "Version is required."}

    package_name = package_name.strip()
    version = version.strip()

    data = connect_to_npm(package_name)
    if "error" in data:
        return data

    versions = data.get("versions") or {}
    available_versions = list(versions.keys())

    if not available_versions:
        return {"error": f"No published versions were found for {package_name}."}

    if version == "latest":
        version = (data.get("dist-tags") or {}).get("latest")
    if not isinstance(version, str) or version not in versions:
        return {
            "error": f"Version '{version}' was not found for {package_name}.",
            "available_versions": sorted(available_versions, key=_version_sort_key, reverse=True)[:10],
        }

    version_metadata = versions.get(version, {})
    dist = version_metadata.get("dist") or {}
    package_metadata = {
        "name": data.get("name", package_name),
        "version": version,
        "description": data.get("description"),
        "repository": version_metadata.get("repository", data.get("repository")),
        "homepage": version_metadata.get("homepage", data.get("homepage")),
        "license": version_metadata.get("license", data.get("license")),
        "old_version": get_base_version(version, available_versions),
        "tarball_url": dist.get("tarball"),
        "integrity": dist.get("integrity"),
        "sha1": dist.get("shasum"),
        "archive_size": dist.get("size"),
        "scripts": version_metadata.get("scripts", {}),
        "git_head": version_metadata.get("gitHead"),
        "npm_package_url": f"https://www.npmjs.com/package/{package_name}",
    }
    return package_metadata
