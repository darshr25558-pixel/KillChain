# KILLCHAIN

KILLCHAIN compares an npm release archive with a GitHub source revision and returns
a deterministic integrity report. Package lifecycle scripts and repository code
are inspected as data only; the scanner does not install dependencies or execute
package code.

## Run locally

```sh
./install.sh
./run.sh
```

The Vite frontend is available at `http://localhost:5173` and proxies `/api` to
the FastAPI backend on port `8000`.

## Scan API

- `POST /api/scan` with `{"name":"react","version":"18.3.1"}` starts a scan and
  returns its report ID. Omit `version` or use `"latest"` for the npm latest tag.
- `GET /api/scan/{id}` returns the saved report.
- `GET /api/scans` lists the latest 100 scans.
- `GET /health` checks backend availability.

Reports include npm integrity verification, safe archive extraction, published
and source manifests, file differences, build-output heuristics, static review
signals, provenance availability, and a transparent heuristic risk score.

Source retrieval currently supports GitHub repositories with an npm `gitHead`
or a matching version tag. Provenance signatures are not cryptographically
verified, security signals require manual review, and risk scores are not a
verdict of malicious intent. Scan history is stored in SQLite at
`backend/data/scans.sqlite3`; set `KILLCHAIN_DB_PATH` to use another location.