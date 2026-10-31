# KillChain

**Published Package vs Source Code Integrity Analyzer**

KillChain analyzes whether a published npm package matches the source code it claims to be built from. It downloads the package tarball from the npm registry, fetches the corresponding GitHub release source, and compares them to detect software supply-chain attacks such as typosquatting, dependency confusion, and malicious code injected at publish time.

## What It Does

1. **Package retrieval** — Downloads a published package version from the npm registry and verifies its registry integrity (shasum).
2. **Safe extraction** — Extracts the tarball with strict safeguards (no code execution, size and file-count limits, path-traversal protection).
3. **Source retrieval** — Resolves the package's GitHub repository and the commit/tag matching the published version.
4. **Manifest & diff** — Builds cryptographic file manifests for both the tarball and the source, then reports added / removed / modified files.
5. **Build-artifact classification** — Explains expected differences (dist bundles, metadata files) so only real anomalies stand out.
6. **Security analysis** — Flags suspicious code and unexpected behavior with severity, evidence, and confidence.
7. **Provenance verification** — Verifies supported npm SLSA DSSE bundles with Sigstore, including signer identity and transparency proof, then compares the signed artifact digest, package identity, source repository, and available source revision with the scan.
8. **Risk scoring** — Produces an evidence-based score (SAFE / WARN / CRITICAL) with transparent reasons.
9. **AI explanation** — Converts deterministic findings into a plain-language summary and recommendation.
10. **Scan history** — Past scans are persisted (SQLite) and browsable from the UI.
11. **Public repository scans** — Inspects public GitHub repositories, lists root and nested npm manifests, and compares a user-selected package/version with its published artifact.

### Provenance verification

The scanner retrieves the attestation bundle referenced by npm metadata and verifies SLSA provenance v1 using Sigstore's production trust roots. It checks the signing certificate's GitHub Actions or GitLab OIDC identity, the DSSE signature and transparency-log proof, the package/version and SHA-512 artifact digest, and the source repository and commit when those claims are available.

Reports distinguish missing or unsupported attestations, unavailable verification data, invalid evidence, signed-claim mismatches, incomplete claims, and fully verified provenance. The pinned Sigstore verifier does not yet support Rekor `intoto/0.0.2` entries with integrated timestamps, so those bundles are reported as unsupported rather than invalid or verified. npm's separate `publish/v0.1` registry attestation is not currently evaluated. A verified attestation is evidence about the build claim; it does not prove that the source itself is safe.

### Public repository scans

Choose **GitHub repository** in the scanner and provide a public URL such as `https://github.com/owner/repository`. KILLCHAIN inspects the default-branch tree for every `package.json`, displays valid package candidates, and requires a selection when a repository contains multiple manifests. The manifest's npm package name and version are prefilled; choose an exact published version (the version can be changed if the manifest describes an unpublished development release).

The default-branch commit is displayed as repository context only and is never silently treated as the release source. Leave the source revision blank to resolve npm `gitHead` or a matching version tag, or enter a specific commit, tag, or branch (suggestions include the first 100 discovered branches and tags). Manually selected revisions are labeled unverified unless npm metadata confirms the commit and repository. Repository content and package scripts are never executed. Very large GitHub trees and repositories with more than 100 package manifests are rejected rather than partially or arbitrarily inspected.

GitHub API requests are unauthenticated by default and may be rate-limited. To raise the limit for a deployed backend, add a read-only GitHub token as the `GITHUB_TOKEN` environment variable in Render's backend service settings. Keep it server-side; never add it to the frontend or commit it to the repository. Deploy the backend after setting the variable. If the quota is exhausted without a token, the API reports a rate-limit error and can be retried after GitHub resets the quota.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Python, FastAPI, Uvicorn, SQLite    |
| Frontend | React 19, TypeScript, Vite, lucide-react |
| Linting  | oxlint (client)                     |
| Tests    | unittest (backend scanner)          |
| Deploy   | Render (backend), Vercel (frontend) |
| CI/CD    | GitHub Actions                      |

## Project Structure

```
KillChain/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── routes/routes.py      # /api endpoints (scan, results, history)
│   ├── helper/scanner.py     # Core analysis engine
│   ├── helper/functions.py   # Registry/package helpers
│   ├── models/models.py      # Request validation (Pydantic)
│   ├── tests/                # Scanner unit tests
│   └── requirements.txt
├── client/
│   └── src/
│       ├── pages/            # Home, Scan, Results, History
│       ├── components/       # RiskScore, SecurityFindings, FileDiff, ProvenanceCheck, ...
│       ├── api.ts            # Backend API client
│       └── types.ts          # Shared types
├── .github/workflows/        # CI/CD (main, test, render deploy)
├── install.sh                # Installs client & backend dependencies
├── run.sh                    # Starts both frontend and backend together
└── render.yaml               # Render deployment config
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js + npm

### Install dependencies

```bash
./install.sh
```

This installs client packages (`npm install` in `client/`), creates a Python virtual environment in `backend/venv`, and installs the backend requirements into it.

### Run locally

```bash
./run.sh
```

This starts:

- **Backend** — Uvicorn serving the FastAPI app on `http://localhost:8000`
- **Frontend** — Vite dev server (`npm run dev`)

Press `Ctrl+C` to stop both processes cleanly.

> In development, Vite proxies `/api` requests to the local backend on port 8000. Set `VITE_API_BASE_URL` to override the API endpoint; production defaults to `https://killchain.onrender.com/api`.

## API

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | `/api/scan`           | Start a scan for `{ name, version }` |
| GET    | `/api/scan/{scan_id}` | Fetch full results for a scan        |
| GET    | `/api/scans`          | List past scans                      |
| POST   | `/api/packages/fetch` | Fetch package metadata from npm      |
| POST   | `/api/repositories/inspect` | Inspect a public GitHub repository and discover package manifests |
| POST   | `/api/repositories/scan` | Scan a selected repository package against its exact npm version |

## CI/CD

GitHub Actions workflows handle testing and deployment. The backend deploys to [Render](https://render.com) via deploy hooks, configured in `render.yaml` (Python 3.11.9, free tier). The frontend deploys to [Vercel](https://vercel.com).

## Roadmap

- Release monitoring — recheck packages when new versions are published
- PyPI support via a separate ecosystem adapter

## Team

**SoloLeveling**

1. [Darsh Rustagi](mailto:darsh.r25558@nst.rishihood.edu.in)
2. [Moksh Bansal](mailto:moksh.b25279@nst.rishihood.edu.in)
3. [Mudit Jindal](mailto:mudit.j25284@nst.rishihood.edu.in)

## License

See [LICENSE](LICENSE).
