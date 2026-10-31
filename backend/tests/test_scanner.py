import io
import json
import tarfile
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import requests
from helper.scanner import (
    ScanError,
    _build_analysis,
    _build_manifest,
    _compare_manifests,
    _extract_tar,
    _extract_zip,
    _resolve_source,
    _safe_member_parts,
)


class ArchiveTests(unittest.TestCase):
    def test_published_tarball_extracts_without_package_prefix(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            archive_path = root / "package.tgz"
            with tarfile.open(archive_path, "w:gz") as archive:
                body = b"module.exports = true\n"
                member = tarfile.TarInfo("package/index.js")
                member.size = len(body)
                archive.addfile(member, io.BytesIO(body))

            extracted = root / "published"
            extracted.mkdir()
            totals = _extract_tar(archive_path, extracted, strip_package=True)
            manifest = _build_manifest(extracted, "artifact-id", None)

            self.assertEqual(totals["files"], 1)
            self.assertEqual(manifest["files"][0]["path"], "index.js")
            self.assertEqual(manifest["files"][0]["size"], len(body))
            self.assertEqual(len(manifest["files"][0]["hash"]), 64)

    def test_github_zip_strips_its_common_root(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            archive_path = root / "source.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("repo-deadbeef/src/index.js", "export const ok = true\n")

            extracted = root / "source"
            extracted.mkdir()
            totals = _extract_zip(archive_path, extracted)
            manifest = _build_manifest(extracted, "source-id", "deadbeef" * 5)

            self.assertEqual(totals["files"], 1)
            self.assertEqual(manifest["files"][0]["path"], "src/index.js")

    def test_archives_reject_traversal_and_windows_paths(self):
        with self.assertRaises(ScanError):
            _safe_member_parts("package/../../outside.txt")
        with self.assertRaises(ScanError):
            _safe_member_parts(r"package\\..\\outside.txt")
        with self.assertRaises(ScanError):
            _safe_member_parts("/etc/passwd")
        with self.assertRaises(ScanError):
            _safe_member_parts("package/C:/outside.txt")
        with self.assertRaises(ScanError):
            _safe_member_parts("package/CON.txt")


class ComparisonTests(unittest.TestCase):
    def test_manifest_comparison_reports_all_file_statuses_and_text_diff(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "source"
            package = root / "package"
            source.mkdir()
            package.mkdir()
            (source / "same.txt").write_text("same\n", encoding="utf-8")
            (package / "same.txt").write_text("same\n", encoding="utf-8")
            (source / "changed.js").write_text("const value = 1\n", encoding="utf-8")
            (package / "changed.js").write_text("const value = 2\n", encoding="utf-8")
            (source / "source-only.txt").write_text("source\n", encoding="utf-8")
            (package / "package-only.txt").write_text("published\n", encoding="utf-8")

            source_manifest = _build_manifest(source, "source-id", "a" * 40)
            package_manifest = _build_manifest(package, "package-id", "a" * 40)
            differences, counts = _compare_manifests(
                source_manifest, package_manifest, source, package
            )

            self.assertEqual(counts, {"added": 1, "removed": 1, "modified": 1, "identical": 1})
            changed = next(item for item in differences if item["status"] == "modified")
            self.assertIn("-const value = 1", changed["textDiff"])
            self.assertIn("+const value = 2", changed["textDiff"])

    def test_unavailable_source_does_not_report_every_package_file_as_added(self):
        differences, counts = _compare_manifests(
            {"files": []},
            {"files": [{"path": "index.js", "hash": "a"}]},
            None,
            Path("."),
        )
        self.assertEqual(differences, [])
        self.assertEqual(counts["added"], 0)

    def test_build_analysis_explains_package_exclusions_and_generated_output(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            source = Path(temporary_directory)
            (source / "package.json").write_text(
                '{"files":["dist"],"scripts":{"build":"tsc"},"devDependencies":{"typescript":"^5"}}',
                encoding="utf-8",
            )
            differences = [
                {"path": "tests/basic.js", "status": "removed"},
                {"path": "dist/index.js", "status": "added"},
            ]

            artifacts, configuration = _build_analysis(source, differences)

            self.assertEqual(artifacts[0]["kind"], "expected-exclusion")
            self.assertEqual(artifacts[1]["kind"], "build-output")
            self.assertIn("typescript", configuration["tools"])
            self.assertEqual(configuration["scripts"]["build"], "tsc")

    def test_source_tag_resolution_follows_annotated_tag_to_commit(self):
        def make_response(payload):
            response = requests.Response()
            response.status_code = 200
            response.headers = {}
            response._content = json.dumps(payload).encode("utf-8")
            response._content_consumed = True
            return response

        tag_object = "a" * 40
        commit = "b" * 40
        responses = [
            make_response({"object": {"sha": tag_object, "type": "tag"}}),
            make_response({"object": {"sha": commit, "type": "commit"}}),
        ]
        with patch("helper.scanner._open_response", side_effect=responses):
            resolved_commit, tag, exact, error = _resolve_source(
                ("owner", "repository"), {}, "1.2.3"
            )

        self.assertEqual(resolved_commit, commit)
        self.assertEqual(tag, "v1.2.3")
        self.assertFalse(exact)
        self.assertIsNone(error)


if __name__ == "__main__":
    unittest.main()
