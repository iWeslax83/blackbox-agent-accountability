# BLACKBOX — Deployment Guide

BLACKBOX has two deployment surfaces:

| Surface | What it gives you | Cost |
|---|---|---|
| **GitHub Pages** | Static landing page + fully-static offline demo (`demo.html`) — no backend required | Free |
| **Render / Docker** | Full live FastAPI service with real-time tribunal auditing | Free tier available |

---

## GitHub Pages — static demo (zero cost)

The static demo and landing page are served directly from the `/docs` folder on the `main` branch via GitHub Pages.

1. In your GitHub repo go to **Settings → Pages**.
2. Set **Source** to `Deploy from a branch`, branch `main`, folder `/docs`.
3. Save. GitHub will publish to:
   - Landing page: `https://iweslax83.github.io/blackbox-agent-accountability/`
   - Demo: `https://iweslax83.github.io/blackbox-agent-accountability/demo.html`

The static demo (`demo.html`) replays pre-recorded events entirely in the browser — no backend, no API key needed. It is the zero-cost public-facing proof-of-concept.

---

## Render — full live API (free tier)

This deploys the FastAPI ingest service with the live Claude tribunal. The offline replay still works without an API key; only `POST /audit/{session_id}` requires one.

### Steps

1. Push your repo to GitHub (or fork it).
2. Go to [render.com](https://render.com) and click **New → Web Service**.
3. Connect your GitHub repo (`blackbox-agent-accountability`).
4. Configure the service:
   - **Environment**: Docker
   - **Dockerfile path**: `./Dockerfile` (Render auto-detects it)
   - **Port**: `8900` (or leave blank — the Dockerfile uses `${PORT:-8900}` so Render's injected `$PORT` is respected automatically)
5. Under **Environment Variables**, add:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```
   This is optional — omit it if you only need the ingest service and chain verifier. The live tribunal (`POST /audit/{session_id}`) will error without it, but all other endpoints work.
6. Click **Deploy**.

Render will build the Docker image and start the service. Your ingest URL will be something like:
```
https://blackbox-agent-accountability.onrender.com
```

Point the dashboard at that URL instead of `localhost:8900`.

---

## Local Docker

Build and run the container locally:

```bash
# Build
docker build -t blackbox .

# Run (offline — no API key)
docker run -p 8900:8900 blackbox

# Run (live tribunal enabled)
docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 8900:8900 blackbox
```

The service is available at `http://localhost:8900`. Open `ui/dashboard.html` in your browser; it polls that address automatically.

---

## Summary

- The **GitHub Pages** static demo is the zero-cost public demo — no server, no API key, always on.
- The **Render / Docker** deploy gives you the full live API: real-time event ingest, hash-chain verification, Claude tribunal auditing, and evidence pack export.
- The ingest service, chain verifier, dashboard, and offline replay all work **without** `ANTHROPIC_API_KEY`. Only `POST /audit/{session_id}` (the live Claude tribunal) requires it.
