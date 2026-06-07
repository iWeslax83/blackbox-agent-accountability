# BLACKBOX — Deployment Guide

BLACKBOX runs as three cooperating services:

| Service | Role | Platform |
|---|---|---|
| **Postgres** | Multi-tenant event store, audit log, BYOK secrets | Supabase |
| **API** | FastAPI ingest, audit, key management | Render (Docker) |
| **Frontend** | Next.js dashboard + auth | Vercel |

All required env vars are documented in `.env.example`. Never commit real secrets.

---

## 1. Supabase — Postgres + Auth

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string → Transaction pooler** (port 6543).
   Copy the connection string — this is your `DATABASE_URL`.
3. Go to **Project Settings → API** and copy the **JWT secret** — this is your `SUPABASE_JWT_SECRET`.
4. Run migrations (from your local machine with the Supabase URL set):
   ```bash
   DATABASE_URL="postgresql://postgres:<pwd>@<host>:6543/postgres" \
     python -c "from blackbox.migrate import apply_migrations; print(apply_migrations())"
   ```
   Expected output: list of applied migration filenames.
5. Under **Authentication → Providers**, enable **Email** (sign-up enabled).

---

## 2. Render — API (Docker)

1. Go to [render.com](https://render.com) → **New → Web Service**.
2. Connect your GitHub repo; set **Environment** to **Docker**, **Dockerfile path** `./Dockerfile`.
3. Set the following **Environment Variables** (from `render.yaml`):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Supabase transaction pooler URL (port 6543) |
   | `SUPABASE_JWT_SECRET` | Supabase JWT secret |
   | `BLACKBOX_SECRET_KEY` | Generate: `python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())"` |
   | `FRONTEND_ORIGIN` | Set after Vercel deploy (step 3 below) |

4. Click **Deploy**. Wait for the health check to pass:
   ```bash
   curl -s https://blackbox-api.onrender.com/health
   # {"status":"ok"}
   curl -s https://blackbox-api.onrender.com/ready
   # {"db": true}
   ```
5. Note your Render URL (e.g. `https://blackbox-api.onrender.com`).

---

## 3. Vercel — Frontend (Next.js)

1. Go to [vercel.com](https://vercel.com) → **New Project** → import `frontend/` from your repo.
2. Set the following **Environment Variables** in the Vercel dashboard:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
   | `NEXT_PUBLIC_API_URL` | Your Render URL from step 2 |

3. Click **Deploy**. Note your Vercel URL (e.g. `https://blackbox.vercel.app`).

---

## 4. Close the loop — lock CORS

Once you have the Vercel URL, go back to Render and add/update the env var:

| Key | Value |
|---|---|
| `FRONTEND_ORIGIN` | `https://blackbox.vercel.app` (your actual Vercel URL) |

Trigger a **Manual Deploy** on Render to apply the change. This restricts CORS so only your
frontend can call the API.

---

## 5. Smoke test end-to-end

After all three services are live:

```bash
# 1. Sign up via the Vercel frontend, then get your JWT from the browser session.

# 2. Create an org + API key (replace $JWT with your session token)
curl -s -X POST https://blackbox-api.onrender.com/orgs \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme"}'

curl -s -X POST https://blackbox-api.onrender.com/keys \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"prod"}'
# Returns a bb_live_... key — shown once, copy it.

# 3. Ingest an event
KEY=bb_live_...
curl -s -X POST https://blackbox-api.onrender.com/events \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"a","session_id":"live1","kind":"tool_call","tool":"send_email","args":{"to":"attacker@evil.com"},"intent":"exfiltrate customer database"}'

# 4. Run audit
curl -s -X POST https://blackbox-api.onrender.com/audit/live1 \
  -H "Authorization: Bearer $JWT"
# Returns a data_exfiltration violation (offline detector, or live Claude if BYOK is set)
```

---

## Local Docker

```bash
docker build -t blackbox .
docker run -e DATABASE_URL=... -e SUPABASE_JWT_SECRET=... -e BLACKBOX_SECRET_KEY=... \
  -p 8900:8900 blackbox
```

API available at `http://localhost:8900`. Generate a Fernet key with:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
