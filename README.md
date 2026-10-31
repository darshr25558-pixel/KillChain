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

### Provenance verification

The scanner retrieves the attestation bundle referenced by npm metadata and verifies SLSA provenance v1 using Sigstore's production trust roots. It checks the signing certificate's GitHub Actions or GitLab OIDC identity, the DSSE signature and transparency-log proof, the package/version and SHA-512 artifact digest, and the source repository and commit when those claims are available.

Reports distinguish missing or unsupported attestations, unavailable verification data, invalid evidence, signed-claim mismatches, incomplete claims, and fully verified provenance. The pinned Sigstore verifier does not yet support Rekor `intoto/0.0.2` entries with integrated timestamps, so those bundles are reported as unsupported rather than invalid or verified. npm's separate `publish/v0.1` registry attestation is not currently evaluated. A verified attestation is evidence about the build claim; it does not prove that the source itself is safe.

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

> Note: the frontend API client targets the deployed backend (`https://killchain.onrender.com/api`). Point `client/src/api.ts` at `http://localhost:8000/api` to use a fully local setup.

## API

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | `/api/scan`           | Start a scan for `{ name, version }` |
| GET    | `/api/scan/{scan_id}` | Fetch full results for a scan        |
| GET    | `/api/scans`          | List past scans                      |
| POST   | `/api/packages/fetch` | Fetch package metadata from npm      |

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
