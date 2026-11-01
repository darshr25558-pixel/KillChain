import unittest
from unittest.mock import patch

from models.models import RepositoryInspect, RepositoryScan
from routes.routes import (
    create_repository_dependency_scan,
    create_repository_scan,
    inspect_repository,
)


class RepositoryRouteTests(unittest.TestCase):
    def setUp(self):
        self.inspection = {
            "repository": {
                "url": "https://github.com/owner/repo",
                "canonicalUrl": "https://github.com/owner/repo",
            },
            "manifests": [
                {
                    "path": "packages/example/package.json",
                    "valid": True,
                    "name": "@owner/example",
                }
            ],
        }

    def test_inspection_route_returns_discovered_repository_data(self):
        with patch(
            "routes.routes.inspect_public_repository",
            return_value=self.inspection,
        ):
            response = inspect_repository(
                RepositoryInspect(repository_url="https://github.com/owner/repo")
            )

        self.assertEqual(response, self.inspection)

    def test_repository_scan_validates_selection_and_starts_existing_scan_pipeline(self):
        scan_result = {
            "id": "scan-id",
            "pkg": {"name": "@owner/example", "version": "1.2.3"},
            "risk": {"score": 10},
            "timestamp": "2026-01-01T00:00:00Z",
        }
        with (
            patch("routes.routes.run_scan", return_value=scan_result) as run_scan,
            patch("routes.routes.save_scan") as save_scan,
        ):
            response = create_repository_scan(
                RepositoryScan(
                    repository_url="https://github.com/owner/repo",
                    manifest_path="packages/example/package.json",
                    name="@owner/example",
                    version="1.2.3",
                )
            )

        self.assertEqual(response, {"id": "scan-id"})
        run_scan.assert_called_once_with(
            "@owner/example",
            "1.2.3",
            repository_url="https://github.com/owner/repo",
            manifest_path="packages/example/package.json",
            source_revision=None,
        )
        save_scan.assert_called_once_with(scan_result)

    def test_repository_scan_rejects_latest_version_instead_of_substituting(self):
        with self.assertRaises(ValueError):
            RepositoryScan(
                repository_url="https://github.com/owner/repo",
                manifest_path="packages/example/package.json",
                name="@owner/example",
                version="latest",
            )

    def test_dependency_audit_route_stores_repository_report(self):
        scan_result = {
            "id": "dependency-scan-id",
            "pkg": {"name": "owner/repo", "version": "main@abc123"},
            "risk": {"score": 0},
            "timestamp": "2026-01-01T00:00:00Z",
        }
        with (
            patch(
                "routes.routes.run_repository_dependency_scan",
                return_value=scan_result,
            ) as run_audit,
            patch("routes.routes.save_scan") as save_scan,
        ):
            response = create_repository_dependency_scan(
                RepositoryInspect(repository_url="https://github.com/owner/repo")
            )

        self.assertEqual(response, {"id": "dependency-scan-id"})
        run_audit.assert_called_once_with("https://github.com/owner/repo")
        save_scan.assert_called_once_with(scan_result)


if __name__ == "__main__":
    unittest.main()
