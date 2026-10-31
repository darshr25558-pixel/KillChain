import io
import json
import tarfile
import tempfile
import unittest
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import Mock, patch

import requests
from cryptography import x509
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.x509.oid import NameOID, ObjectIdentifier
from sigstore.errors import VerificationError
from helper.scanner import (
    ScanError,
    _build_analysis,
    _build_manifest,
    _compare_manifests,
    _extract_tar,
    _extract_zip,
    _resolve_source,
    _safe_member_parts,
    _verify_npm_provenance,
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


class ProvenanceTests(unittest.TestCase):
    package_name = "@actions/core"
    version = "1.11.1"
    artifact_sha512 = "a" * 128
    source_commit = "d14afd7973c037fa9f72882decd1eb3befa36135"

    def setUp(self):
        private_key = Ed25519PrivateKey.generate()
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "test signer")])
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        self.certificate = (
            x509.CertificateBuilder()
            .subject_name(name)
            .issuer_name(name)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now - timedelta(minutes=1))
            .not_valid_after(now + timedelta(minutes=1))
            .add_extension(
                x509.SubjectAlternativeName(
                    [x509.UniformResourceIdentifier(
                        "https://github.com/actions/toolkit/.github/workflows/release.yml@refs/heads/main"
                    )]
                ),
                critical=False,
            )
            .add_extension(
                x509.UnrecognizedExtension(
                    ObjectIdentifier("1.3.6.1.4.1.57264.1.1"),
                    b"https://token.actions.githubusercontent.com",
                ),
                critical=False,
            )
            .sign(private_key, algorithm=None)
        )
        self.statement = {
            "_type": "https://in-toto.io/Statement/v1",
            "predicateType": "https://slsa.dev/provenance/v1",
            "subject": [
                {
                    "name": "pkg:npm/%40actions/core@1.11.1",
                    "digest": {"sha512": self.artifact_sha512},
                }
            ],
            "predicate": {
                "buildDefinition": {
                    "externalParameters": {
                        "workflow": {
                            "repository": "https://github.com/actions/toolkit",
                            "path": ".github/workflows/release.yml",
                        }
                    },
                    "resolvedDependencies": [
                        {
                            "uri": "git+https://github.com/actions/toolkit@refs/heads/main",
                            "digest": {"gitCommit": self.source_commit},
                        }
                    ],
                }
            },
        }

    def _scan_provenance(self, statement=None, verify_error=None, tlog_entry=None):
        bundle = Mock(signing_certificate=self.certificate)
        payload = json.dumps(statement or self.statement).encode()
        verifier = Mock()
        if verify_error:
            verifier.verify_dsse.side_effect = verify_error
        else:
            def verify_dsse(_bundle, policy):
                policy.verify(self.certificate)
                return "application/vnd.in-toto+json", payload
            verifier.verify_dsse.side_effect = verify_dsse

        with (
            patch(
                "helper.scanner._fetch_json",
                return_value={
                    "attestations": [
                        {
                            "predicateType": "https://slsa.dev/provenance/v1",
                            "bundle": {
                                "mediaType": "application/vnd.dev.sigstore.bundle+json",
                                "verificationMaterial": {
                                    "tlogEntries": [tlog_entry] if tlog_entry else []
                                },
                            },
                        }
                    ]
                },
            ),
            patch("helper.scanner.Bundle.from_json", return_value=bundle),
            patch("helper.scanner.Verifier.production", return_value=verifier),
        ):
            return _verify_npm_provenance(
                {"attestations": {"url": "https://registry.npmjs.org/attestations"}},
                self.package_name,
                self.version,
                self.artifact_sha512,
                ("actions", "toolkit"),
                self.source_commit,
            )

    def test_verified_attestation_checks_artifact_and_source_claims(self):
        result = self._scan_provenance()

        self.assertTrue(result["cryptographicVerified"])
        self.assertTrue(result["verified"])
        self.assertEqual(result["status"], "verified")
        self.assertTrue(result["artifactDigestMatch"])
        self.assertTrue(result["packageIdentityMatch"])
        self.assertTrue(result["sourceRepositoryMatch"])
        self.assertTrue(result["sourceCommitMatch"])

    def test_valid_signature_with_wrong_artifact_digest_is_claim_mismatch(self):
        statement = json.loads(json.dumps(self.statement))
        statement["subject"][0]["digest"]["sha512"] = "b" * 128

        result = self._scan_provenance(statement=statement)

        self.assertTrue(result["cryptographicVerified"])
        self.assertFalse(result["verified"])
        self.assertEqual(result["status"], "verified-claims-mismatch")
        self.assertFalse(result["artifactDigestMatch"])

    def test_missing_source_revision_claim_is_incomplete_not_verified(self):
        statement = json.loads(json.dumps(self.statement))
        statement["predicate"]["buildDefinition"]["resolvedDependencies"] = []

        result = self._scan_provenance(statement=statement)

        self.assertTrue(result["cryptographicVerified"])
        self.assertFalse(result["verified"])
        self.assertEqual(result["status"], "verified-claims-incomplete")
        self.assertIsNone(result["sourceCommitMatch"])

    def test_invalid_signature_is_not_reported_as_verified(self):
        result = self._scan_provenance(verify_error=VerificationError("bad signature"))

        self.assertFalse(result["cryptographicVerified"])
        self.assertFalse(result["verified"])
        self.assertEqual(result["status"], "invalid")

    def test_unsupported_rekor_entry_is_not_mislabeled_invalid(self):
        result = self._scan_provenance(
            tlog_entry={
                "integratedTime": 1,
                "inclusionPromise": {"signedEntryTimestamp": "signature"},
                "kindVersion": {"kind": "intoto", "version": "0.0.2"},
            }
        )

        self.assertFalse(result["cryptographicVerified"])
        self.assertFalse(result["verified"])
        self.assertEqual(result["status"], "unsupported")

    def test_absent_attestation_is_distinguished_from_invalid_evidence(self):
        result = _verify_npm_provenance(
            {}, self.package_name, self.version, self.artifact_sha512, None, None
        )

        self.assertFalse(result["signed"])
        self.assertFalse(result["verified"])
        self.assertEqual(result["status"], "unavailable")


if __name__ == "__main__":
    unittest.main()
