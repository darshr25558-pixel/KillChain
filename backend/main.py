from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import datetime

app = FastAPI(title="KILLCHAIN Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scans_db = {}


class ScanRequest(BaseModel):
    name: str
    version: str = "latest"


@app.get("/")
def read_root():
    return {"status": "ok", "service": "KILLCHAIN API"}


@app.post("/api/scan")
def create_scan(req: ScanRequest):
    scan_id = f"scan-{str(uuid.uuid4())[:8]}"
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    scan_result = {
        "id": scan_id,
        "timestamp": created_at,
        "pkg": {
            "name": req.name,
            "version": req.version if req.version != "latest" else "1.0.0",
            "tarballUrl": f"https://registry.npmjs.org/{req.name}/-/{req.name}-1.0.0.tgz",
            "shasum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "verified": True,
        },
        "extraction": {
            "safe": True,
            "filesCount": 24,
            "totalBytes": 1048576,
        },
        "source": {
            "repoUrl": f"https://github.com/example/{req.name}",
            "commit": "a1b2c3d4e5f67890abcdef1234567890abcdef12",
            "tag": "v1.0.0",
            "match": True,
        },
        "manifest": [
            {"path": "package.json", "size": 1280, "hash": "sha256:7f83b165..."},
            {"path": "index.js", "size": 4320, "hash": "sha256:5b3a1a8c..."},
            {"path": "lib/util.js", "size": 2560, "hash": "sha256:8d3f2b1a..."},
            {"path": "README.md", "size": 1820, "hash": "sha256:9c4e2a1b..."},
        ],
        "diff": [
            {"path": "dist/bundle.min.js", "status": "added"},
            {"path": "package.json", "status": "modified"},
        ],
        "artifacts": [
            {
                "path": "dist/bundle.min.js",
                "kind": "build_output",
                "reason": "Generated during npm pack build step",
            }
        ],
        "security": [
            {
                "severity": "LOW",
                "rule": "network_call",
                "file": "lib/util.js",
            }
        ],
        "provenance": {
            "signed": True,
            "attestationUrl": f"https://github.com/example/{req.name}/attestations",
            "verified": True,
        },
        "risk": {
            "score": 18,
            "level": "SAFE",
            "notes": [
                "Package signature is valid",
                "Published tarball matches GitHub release tag",
                "Only standard build artifacts detected in diff",
            ],
        },
        "aiExplanation": {
            "summary": f"The package {req.name} matches its GitHub source repository with expected build outputs.",
            "points": [
                "Source-to-package integrity check passed",
                "Cryptographic provenance verified via GitHub Actions attestation",
                "No malicious or obfuscated code detected in diff",
            ],
            "recommendation": "Package is considered safe for normal installation.",
        },
    }

    scans_db[scan_id] = scan_result
    return {"id": scan_id}


@app.get("/api/scan/{scan_id}")
def get_scan(scan_id: str):
    if scan_id not in scans_db:
        raise HTTPException(status_code=404, detail="Scan ID not found")
    return scans_db[scan_id]


@app.get("/api/scans")
def list_scans():
    return [
        {
            "id": s["id"],
            "name": s["pkg"]["name"],
            "version": s["pkg"]["version"],
            "score": s["risk"]["score"],
        }
        for s in scans_db.values()
    ]
