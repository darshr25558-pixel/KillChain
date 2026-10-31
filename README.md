# KillChain

**Published Package vs Source Code Integrity Analyzer**

KillChain is a security tool that analyzes whether a published package (e.g. from npm or PyPI) matches the source code it claims to be built from, helping detect software supply-chain attacks such as typosquatting, dependency confusion, and malicious code injected at publish time.

> ⚠️ **Status:** Early stage / under active development. The project structure, setup scripts, and CI/CD pipeline are in place; the core analysis engine and UI are being built.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Python, FastAPI, Uvicorn            |
| Frontend | React 19, TypeScript, Vite          |
| Linting  | oxlint (client)                     |
| Deploy   | Render (backend, via deploy hooks)  |
| CI/CD    | GitHub Actions                      |

## Project Structure

```
KillChain/
├── backend/          # FastAPI backend
│   ├── main.py       # API entry point
│   └── requirements.txt
├── client/           # React + Vite frontend
│   └── src/
├── .github/
│   └── workflows/    # CI/CD (main, test, render deploy)
├── install.sh        # Installs client & backend dependencies
├── run.sh            # Starts both frontend and backend together
└── render.yaml       # Render deployment config
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js + npm

### Install dependencies

```bash
./install.sh
```

This runs `npm install` in `client/` and `pip install -r requirements.txt` in `backend/`.

### Run locally

```bash
./run.sh
```

This starts:

- **Backend** — Uvicorn serving the FastAPI app on `http://localhost:8080`
- **Frontend** — Vite dev server (`npm run dev`)

Press `Ctrl+C` to stop both processes cleanly.

## API

The backend currently exposes a minimal API (in active development):

- `GET /` — health check
- `GET /items/{item_id}` — placeholder endpoint

## CI/CD

GitHub Actions workflows handle testing and deployment. The backend deploys to [Render](https://render.com) via deploy hooks, configured in `render.yaml` (Python 3.11.9, free tier, auto-deploy disabled in favor of Actions-controlled deploys).

## Team

**SoloLeveling**

1. [Darsh Rustagi](mailto:darsh.r25558@nst.rishihood.edu.in)
2. [Moksh Bansal](mailto:moksh.b25279@nst.rishihood.edu.in)
3. [Mudit Jindal](mailto:mudit.j25284@nst.rishihood.edu.in)

## License

See [LICENSE](LICENSE).
