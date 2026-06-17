# Setup & Run — All Services

Quick reference to start every service in order.

## Prerequisites

```bash
# Check
node --version  # >= 18
python3 --version  # >= 3.11
docker --version
```

## 1. Docker — Postgres + Redis

```bash
# Start existing containers
docker start applymate-pg    # PostgreSQL :5432
docker start applymate-redis # Redis :6379

# First time? Create them:
docker run -d --name applymate-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=applymate \
  -p 5432:5432 postgres:16-alpine

docker run -d --name applymate-redis \
  -p 6379:6379 redis:7-alpine

# Verify
docker ps -a | grep applymate
```

## 2. Backend — FastAPI (:8000)

```bash
cd backend

# First time
pip install -r requirements.txt
mkdir -p uploads
cp .env.example .env  # edit DB creds + API keys

# Run
PYTHONPATH=$PWD uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Verify
curl http://localhost:8000/api/health
# → {"status":"healthy","version":"0.2.0"}
```

## 3. Frontend — Next.js (:3000)

```bash
cd frontend

# First time
npm install
cp .env.example .env.local  # edit Clerk keys etc.

# Run
npm run dev

# Verify
curl http://localhost:3000
# → HTML (200)
```

## 4. Sidecar — Node.js (:4197)

```bash
cd sidecar

# First time
npm install
cp .env.example .env  # edit paths (see below)

# Run
npm run dev

# Verify
curl http://localhost:4197/api/health
# → {"status":"ok"}
```

## 5. OpenCode Server (:4196)

```bash
# Using systemd (if installed)
systemctl --user start opencode-serve

# Or directly
opencode serve --port 4196

# Verify
curl http://localhost:4196/health
# → {"status":"ok"}
```

## Dependency Order

```
Docker (PG + Redis)
  ↓
Backend (:8000) — needs PG
  ↓
Sidecar (:4197) — connects to OpenCode
  ↓
Frontend (:3000) — proxies /api/* → backend
```

OpenCode server can start anytime before Sidecar.

## Quick Health Check

```bash
# One-liner to verify all ports
for port in 5432 6379 8000 3000 4197 4196; do
  (echo >/dev/tcp/localhost/$port) 2>/dev/null &&
    echo ":$port OK" || echo ":$port DOWN"
done
```

## Env Files

| Service | File | Key Vars |
|---------|------|----------|
| Backend | `backend/.env` | `DATABASE_URL`, `OPENROUTER_API_KEY` |
| Frontend | `frontend/.env.local` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Sidecar | `sidecar/.env` | `CAREER_OPS_PATH`, `OPENCODE_HOST` |

## Logs

```bash
# Backend logs (if piped)
tail -f /tmp/backend.log

# Sidecar logs (stdout)
# Already visible in terminal running npm run dev

# OpenCode systemd
journalctl --user -u opencode-serve -f
```

## Stop

```bash
# Kill by port
kill $(lsof -ti:8000)    # backend
kill $(lsof -ti:3000)    # frontend
kill $(lsof -ti:4197)    # sidecar
kill $(lsof -ti:4196)    # opencode

# Stop docker
docker stop applymate-pg applymate-redis
```
