import io
import json
import shutil
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
    _build_dependency_inventory,
    _build_manifest,
    _compare_manifests,
    _extract_tar,
    _extract_zip,
    _fetch_github_json,
    _github_api_headers,
    _normalize_public_github_url,
    _dependency_risk,
    _query_osv_dependencies,
    _registry_metadata,
    _resolve_repository_revision,
    _resolve_source,
    _safe_member_parts,
    inspect_public_repository,
    run_repository_dependency_scan,
    run_scan,
    _verify_npm_provenance,
)
from models.models import RepositoryScan


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


class RepositoryTests(unittest.TestCase):
    def test_dependency_inventory_resolves_direct_dev_and_transitive_packages(self):
        inspection = {
            "manifests": [
                {
                    "path": "package.json",
                    "name": "app",
                    "dependencies": {"react": "^19.0.0"},
                    "devDependencies": {"typescript": "^5.0.0"},
                }
            ]
        }
        lockfiles = {
            "package-lock.json": {
                "lockfileVersion": 3,
                "packages": {
                    "": {
                        "dependencies": {"react": "^19.0.0"},
                        "devDependencies": {"typescript": "^5.0.0"},
                    },
                    "node_modules/react": {"version": "19.1.0"},
                    "node_modules/other/node_modules/react": {"version": "18.3.1"},
                    "node_modules/scheduler": {"version": "0.26.0"},
                    "node_modules/typescript": {"version": "5.9.2", "dev": True},
                },
            }
        }

        dependencies, local_count = _build_dependency_inventory(inspection, lockfiles)
        by_name_version = {
            (item["name"], item["version"]): item for item in dependencies
        }

        self.assertEqual(local_count, 0)
        self.assertEqual(len(dependencies), 4)
        self.assertTrue(by_name_version[("react", "19.1.0")]["direct"])
        self.assertFalse(by_name_version[("react", "18.3.1")]["direct"])
        self.assertTrue(by_name_version[("typescript", "5.9.2")]["direct"])
        self.assertTrue(by_name_version[("typescript", "5.9.2")]["development"])
        self.assertFalse(by_name_version[("scheduler", "0.26.0")]["direct"])
        self.assertEqual(
            by_name_version[("scheduler", "0.26.0")]["dependencyTypes"],
            ["transitive"],
        )

    def test_unlocked_dependency_ranges_are_reported_unresolved(self):
        dependencies, _ = _build_dependency_inventory(
            {
                "manifests": [
                    {
                        "path": "package.json",
                        "dependencies": {"react": "^19.0.0"},
                    }
                ]
            },
            {},
        )

        self.assertEqual(len(dependencies), 1)
        self.assertIsNone(dependencies[0]["version"])
        self.assertFalse(dependencies[0]["resolved"])
        self.assertEqual(dependencies[0]["versionSpec"], ["^19.0.0"])

    def test_dependency_risk_warns_when_no_lockfile_covers_transitive_dependencies(self):
        risk = _dependency_risk(
            [{"name": "react", "version": "19.0.0", "vulnerabilities": []}],
            unresolved_count=0,
            lockfile_available=False,
        )

        self.assertEqual(risk["score"], 25)
        self.assertEqual(risk["level"], "WARN")
        self.assertTrue(any("transitive dependencies could not be enumerated" in note for note in risk["notes"]))

    def test_osv_matches_are_attached_and_risk_does_not_double_count_advisory_ids(self):
        dependencies = [
            {"name": "left-pad", "version": "1.3.0", "vulnerabilities": []},
            {"name": "left-pad", "version": "1.2.0", "vulnerabilities": []},
        ]
        with patch(
            "helper.scanner._post_osv_json",
            return_value={
                "results": [
                    {"vulns": [{"id": "GHSA-test-1234"}]},
                    {"vulns": [{"id": "GHSA-test-1234"}]},
                ]
            },
        ) as query, patch(
            "helper.scanner._fetch_osv_vulnerability",
            return_value={
                "id": "GHSA-test-1234",
                "aliases": ["CVE-2026-1234"],
                "summary": "Test advisory",
                "database_specific": {"severity": "HIGH"},
            },
        ) as fetch_details:
            queried = _query_osv_dependencies(dependencies)

        self.assertEqual(queried, 2)
        query.assert_called_once()
        fetch_details.assert_called_once_with("GHSA-test-1234")
        self.assertEqual(len(dependencies[0]["vulnerabilities"]), 1)
        self.assertEqual(dependencies[0]["vulnerabilities"][0]["severity"], "HIGH")
        dependencies[1]["vulnerabilities"].append(
            {
                "id": "CVE-2026-1234",
                "aliases": ["GHSA-test-1234"],
                "severity": "HIGH",
            }
        )
        risk = _dependency_risk(dependencies, unresolved_count=0)
        self.assertEqual(risk["score"], 25)
        self.assertEqual(risk["level"], "WARN")

    def test_repository_dependency_scan_saves_a_default_branch_osv_report(self):
        inspection = {
            "repository": {
                "url": "https://github.com/owner/repo",
                "canonicalUrl": "https://github.com/owner/repo",
                "name": "owner/repo",
                "defaultBranch": "main",
                "defaultBranchCommit": "a" * 40,
            },
            "manifests": [
                {
                    "path": "package.json",
                    "name": "private-app",
                    "version": "1.0.0",
                    "dependencies": {"react": "^19.0.0"},
                    "devDependencies": {},
                }
            ],
            "lockfiles": ["package-lock.json"],
        }
        lockfile = {
            "lockfileVersion": 3,
            "packages": {"node_modules/react": {"version": "19.1.0"}},
        }
        with (
            patch("helper.scanner.inspect_public_repository", return_value=inspection),
            patch(
                "helper.scanner._read_github_raw_file",
                return_value=json.dumps(lockfile),
            ),
            patch(
                "helper.scanner._post_osv_json",
                return_value={"results": [{"vulns": []}]},
            ) as osv_query,
        ):
            result = run_repository_dependency_scan("https://github.com/owner/repo")

        self.assertEqual(result["scanType"], "repository-dependencies")
        self.assertEqual(result["pkg"]["name"], "owner/repo")
        self.assertEqual(result["pkg"]["version"], f"main@{'a' * 12}")
        self.assertEqual(result["risk"]["level"], "SAFE")
        self.assertEqual(result["dependencyAudit"]["summary"]["queried"], 1)
        self.assertEqual(result["dependencyAudit"]["dependencies"][0]["name"], "react")
        json.dumps(result)
        osv_query.assert_called_once()

    def test_missing_npm_package_error_explains_published_package_requirement(self):
        with patch(
            "helper.scanner._fetch_json",
            side_effect=ScanError("Remote metadata request failed with HTTP 404.", status_code=404),
        ):
            with self.assertRaises(ScanError) as raised:
                _registry_metadata("portfolio-new")

        self.assertEqual(raised.exception.status_code, 404)
        self.assertIn("portfolio-new", str(raised.exception))
        self.assertIn("published npm version", str(raised.exception))

    def test_github_api_omits_authorization_header_without_token(self):
        response = requests.Response()
        response.status_code = 200
        response.headers = {}
        response._content = b"{}"
        response._content_consumed = True
        url = "https://api.github.com/repos/owner/repo"

        with (
            patch.dict("os.environ", {}, clear=True),
            patch("helper.scanner._open_response", return_value=response) as open_response,
        ):
            self.assertEqual(_fetch_github_json(url), {})

        self.assertEqual(open_response.call_args.args[2], {"Accept": "application/vnd.github+json"})

    def test_github_api_uses_optional_server_side_token(self):
        response = requests.Response()
        response.status_code = 200
        response.headers = {}
        response._content = b"{}"
        response._content_consumed = True
        url = "https://api.github.com/repos/owner/repo"

        with (
            patch.dict("os.environ", {"GITHUB_TOKEN": " test-token "}),
            patch("helper.scanner._open_response", return_value=response) as open_response,
        ):
            self.assertEqual(_fetch_github_json(url), {})

        open_response.assert_called_once_with(
            url,
            ("api.github.com",),
            {
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer test-token",
            },
        )

    def test_github_api_rate_limit_error_explains_server_token_configuration(self):
        response = requests.Response()
        response.status_code = 403
        response.headers = {"X-RateLimit-Remaining": "0"}
        response._content = b'{"message":"API rate limit exceeded"}'
        response._content_consumed = True

        with patch("helper.scanner._open_response", return_value=response):
            with self.assertRaises(ScanError) as raised:
                _fetch_github_json("https://api.github.com/repos/owner/repo")

        self.assertEqual(raised.exception.status_code, 503)
        self.assertIn("GITHUB_TOKEN", str(raised.exception))

    def test_normalizes_public_github_repository_urls(self):
        normalized, repository = _normalize_public_github_url(
            "https://github.com/Owner/Repo.git/"
        )

        self.assertEqual(normalized, "https://github.com/Owner/Repo")
        self.assertEqual(repository, ("Owner", "Repo"))

    def test_rejects_non_repository_github_urls(self):
        for url in (
            "http://github.com/owner/repo",
            "https://user:password@github.com/owner/repo",
            "https://github.com/owner/repo/tree/main",
            "https://github.com/owner/repo?tab=readme",
            "https://example.com/owner/repo",
        ):
            with self.subTest(url=url), self.assertRaises(ScanError):
                _normalize_public_github_url(url)

    def test_repository_inspection_lists_root_and_nested_package_manifests(self):
        commit = "a" * 40

        def github_json(url):
            if url.endswith("/repos/owner/repo"):
                return {
                    "html_url": "https://github.com/owner/repo",
                    "full_name": "owner/repo",
                    "description": "test repo",
                    "default_branch": "main",
                    "private": False,
                    "updated_at": "2026-01-01T00:00:00Z",
                }
            if url.endswith("/branches?per_page=100"):
                return [{"name": "main", "commit": {"sha": commit}}]
            if url.endswith("/tags?per_page=100"):
                return [{"name": "v1.0.0", "commit": {"sha": commit}}]
            if url.endswith("/releases?per_page=100"):
                return [{"name": "Release 1", "tag_name": "v1.0.0"}]
            if url.endswith("/branches/main"):
                return {"commit": {"sha": commit}}
            if url.endswith(f"/git/trees/{commit}?recursive=1"):
                return {
                    "truncated": False,
                    "tree": [
                        {"path": "package.json", "type": "blob"},
                        {"path": "packages/one/package.json", "type": "blob"},
                        {"path": "package-lock.json", "type": "blob"},
                        {"path": "README.md", "type": "blob"},
                    ],
                }
            self.fail(f"Unexpected GitHub API URL: {url}")

        def raw_file(url):
            if url.endswith("/packages/one/package.json"):
                return json.dumps(
                    {
                        "name": "@owner/one",
                        "version": "2.0.0",
                        "workspaces": ["packages/*"],
                        "scripts": {"build": "tsc"},
                        "dependencies": {"typescript": "^5"},
                    }
                )
            if url.endswith("/package.json"):
                return json.dumps(
                    {"name": "root-package", "version": "1.0.0", "private": True}
                )
            self.fail(f"Unexpected raw GitHub URL: {url}")

        with (
            patch("helper.scanner._fetch_github_json", side_effect=github_json),
            patch("helper.scanner._read_github_raw_file", side_effect=raw_file),
        ):
            result = inspect_public_repository("https://github.com/owner/repo/")

        self.assertEqual(result["repository"]["defaultBranchCommit"], commit)
        self.assertTrue(result["manifests"][0]["private"])
        self.assertEqual(result["lockfiles"], ["package-lock.json"])
        self.assertEqual([item["path"] for item in result["manifests"]], [
            "package.json",
            "packages/one/package.json",
        ])
        self.assertEqual(result["manifests"][1]["name"], "@owner/one")
        self.assertEqual(result["manifests"][1]["directory"], "packages/one")
        self.assertEqual(result["manifests"][1]["scripts"]["build"], "tsc")
        self.assertEqual(result["releases"][0]["tag"], "v1.0.0")

    def test_repository_revision_resolves_selected_ref_without_claiming_unmatched_git_head(self):
        commit = "b" * 40
        with patch(
            "helper.scanner._fetch_github_json", return_value={"sha": commit}
        ):
            resolved, reference, exact, association = _resolve_repository_revision(
                ("owner", "repo"), "release/1.2", "a" * 40
            )

        self.assertEqual(resolved, commit)
        self.assertEqual(reference, "release/1.2")
        self.assertFalse(exact)
        self.assertEqual(association, "selected")

    def test_repository_scan_requires_an_exact_npm_version(self):
        with self.assertRaises(ValueError):
            RepositoryScan(
                repository_url="https://github.com/owner/repo",
                manifest_path="package.json",
                name="package",
                version="latest",
            )

    def test_repository_scan_compares_selected_nested_manifest_with_exact_npm_release(self):
        commit = "c" * 40
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            published_archive = root / "published.tgz"
            with tarfile.open(published_archive, "w:gz") as archive:
                for path, content in (
                    ("package/package.json", '{"name":"@owner/example","version":"1.0.0"}'),
                    ("package/index.js", "module.exports = true;\n"),
                ):
                    body = content.encode()
                    member = tarfile.TarInfo(path)
                    member.size = len(body)
                    archive.addfile(member, io.BytesIO(body))

            source_archive = root / "source.zip"
            with zipfile.ZipFile(source_archive, "w") as archive:
                archive.writestr(
                    "repo-root/packages/example/package.json",
                    '{"name":"@owner/example","version":"1.0.0"}',
                )
                archive.writestr(
                    "repo-root/packages/example/index.js",
                    "module.exports = true;\n",
                )

            version_metadata = {
                "repository": "https://github.com/owner/repo",
                "gitHead": commit,
                "dist": {
                    "tarball": "https://registry.npmjs.org/example/-/example-1.0.0.tgz"
                },
            }
            registry_metadata = {
                "name": "@owner/example",
                "repository": "https://github.com/owner/repo",
                "versions": {"1.0.0": version_metadata},
                "dist-tags": {"latest": "1.0.0"},
            }

            def download_published(_url, destination, *_args):
                shutil.copyfile(published_archive, destination)
                return {
                    "size": published_archive.stat().st_size,
                    "sha256": "a" * 64,
                    "sha512": "b" * 128,
                    "sha1": "c" * 40,
                    "verified": True,
                    "algorithm": "sha512",
                    "integrity": "sha512-test",
                }

            def download_source(_owner, _repo, _commit, destination):
                shutil.copyfile(source_archive, destination)

            with (
                patch("helper.scanner._registry_metadata", return_value=registry_metadata),
                patch("helper.scanner._download_archive", side_effect=download_published),
                patch(
                    "helper.scanner._resolve_source",
                    return_value=(commit, f"gitHead:{commit}", True, None),
                ),
                patch("helper.scanner._download_source_archive", side_effect=download_source),
            ):
                result = run_scan(
                    "@owner/example",
                    "1.0.0",
                    repository_url="https://github.com/owner/repo",
                    manifest_path="packages/example/package.json",
                )

        self.assertEqual(result["pkg"]["version"], "1.0.0")
        self.assertEqual(result["source"]["commit"], commit)
        self.assertTrue(result["source"]["match"])
        self.assertEqual(result["source"]["manifestPath"], "packages/example/package.json")
        self.assertIn('"name":"@owner/example"', result["source"]["packageManifest"])
        self.assertEqual(result["comparison"]["summary"]["identical"], 2)


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
