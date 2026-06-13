# ApplyMate

AI-powered job application automation platform. Tailors resumes, generates cover letters, tracks applications.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009974)
![License](https://img.shields.io/badge/License-MIT-blue)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 18, Tailwind CSS |
| Auth | Clerk |
| Backend | FastAPI (Python 3.14) |
| Database | PostgreSQL 16 (Docker) |
| Task Queue | Redis + Celery |
| AI/LLM | OpenRouter / Gemini |
| PDF | WeasyPrint |

---

## 🚀 Quick Start

### 1. Start Infrastructure (Docker)

Containers already exist. Just start them:

```bash
docker start applymate-pg   # PostgreSQL on :5432
docker start applymate-redis # Redis on :6379
```

**First time?** Create containers:

```bash
# PostgreSQL
docker run -d --name applymate-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=applymate \
  -p 5432:5432 postgres:16-alpine

# Redis
docker run -d --name applymate-redis \
  -p 6379:6379 redis:7-alpine
```

DB tables auto-create on backend startup via SQLAlchemy. No manual SQL needed.

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env  # then edit
```

Key vars in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applymate
LLM_MOCK_MODE=true                    # dev mode, no API key needed
OPENROUTER_API_KEY=sk-or-...          # prod: real LLM key
```

### 3. Run Backend

```bash
cd backend
pip install -r requirements.txt
mkdir -p uploads

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend starts at **http://localhost:8000**

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

---

## 📖 API Docs

| URL | Description |
|-----|-------------|
| http://localhost:8000/docs | Swagger UI (interactive) |
| http://localhost:8000/redoc | ReDoc UI |
| http://localhost:8000/openapi.json | OpenAPI schema |

---

## 📋 Full API Routes

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

### Auth & Users

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/clerk` | Clerk webhook handler |
| GET | `/api/users/me` | Get profile |
| PUT | `/api/users/me` | Update profile |

### Applications (Tracking)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/applications` | List user apps |
| GET | `/api/applications/stats` | Aggregated stats |
| GET | `/api/applications/{id}` | App detail |
| PATCH | `/api/applications/{id}` | Update status |
| DELETE | `/api/applications/{id}` | Delete app |
| GET | `/api/applications/{id}/events` | Timeline events |
| POST | `/api/applications/{id}/events` | Add event |
| POST | `/api/applications/import` | **Import from external agent** |
| GET | `/api/applications/{id}/report` | Get report markdown |
| GET | `/api/applications/{id}/cv` | Get CV PDF |

### Scan History & Pipeline

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scan-history` | List scanned jobs |
| POST | `/api/scan-history` | Add scan entry |
| GET | `/api/pipeline` | List pipeline entries |
| POST | `/api/pipeline` | Add pipeline entry |
| PATCH | `/api/pipeline/{id}` | Update pipeline entry |

### Resume Tailoring (V3 - Current)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/resume/upload` | Upload PDF/DOCX |
| POST | `/api/resume/tailor-v3` | Full LLM pipeline |
| GET | `/api/resume/v3/{id}/download` | Download PDF |
| GET | `/api/resume/{id}/json` | Resume JSON |
| GET | `/api/resume/templates` | List templates |
| DELETE | `/api/resumes/tailored/{id}` | Delete tailored |

### Credits

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/credits/balance` | Get balance |
| POST | `/api/credits/purchase` | Purchase credits |

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jobs/analyze` | Analyze job URL |
| POST | `/api/jobs/apply` | Queue application |

---

## 🤖 External Agent Integration (Career-Ops)

Your career-ops agents can push data directly via API. **No DB access needed.**

### Import Endpoint

```bash
POST http://localhost:8000/api/applications/import
```

Payload example:

```json
{
  "job_title": "Senior AI Engineer",
  "company_name": "Acme Corp",
  "job_url": "https://jobs.ashbyhq.com/acme/123",
  "location": "Dubai, UAE",
  "salary_range": "200K-250K AED",
  "status": "applied",
  "match_score": 86,
  "score_rating": "4.3/5",
  "has_pdf": true,
  "report_path": "reports/001-acme-2026-06-14.md",
  "report_number": "001",
  "portal": "Greenhouse",
  "notes": "Custom CV uploaded, cover letter typed",
  "cv_used": "cv-acme-2026-06-14.pdf",
  "cv_file_path": "uploads/cv-acme-2026-06-14.pdf",
  "applied_at": "2026-06-14T10:30:00",
  "report_content": "# Report\n\nFull markdown report content...",
  "cv_content": "<base64-encoded-pdf>",
  "events": [
    { "event_type": "submitted", "message": "Application submitted via Greenhouse" },
    { "event_type": "followup", "message": "Follow-up email sent to hiring@acme.com" }
  ]
}
```

### Scan History Endpoint

```bash
POST http://localhost:8000/api/scan-history

{
  "job_url": "https://job-boards.greenhouse.io/acme/jobs/123",
  "title": "Senior AI Engineer",
  "company": "Acme Corp",
  "location": "Dubai",
  "portal": "Greenhouse API",
  "status": "added",
  "first_seen": "2026-06-14"
}
```

### Pipeline Endpoint

```bash
POST http://localhost:8000/api/pipeline

{
  "job_url": "https://jobs.ashbyhq.com/acme/456",
  "title": "Forward Deployed Engineer",
  "company": "Acme Corp",
  "section": "pending"
}
```

```bash
PATCH http://localhost:8000/api/pipeline/{entry_id}

{
  "section": "evaluated"
}
```

### Event Tracking

```bash
POST http://localhost:8000/api/applications/{app_id}/events

{
  "event_type": "followup",
  "message": "2nd follow-up sent to hiring manager",
  "payload": {
    "channel": "email",
    "contact": "john@acme.com"
  }
}
```

---

## 🐳 Docker Reference

### Start/Stop
```bash
docker start applymate-pg applymate-redis
docker stop applymate-pg applymate-redis
```

### Check status
```bash
docker ps -a | grep applymate
```

### Logs
```bash
docker logs applymate-pg
docker logs applymate-redis
```

### PostgreSQL shell
```bash
docker exec -it applymate-pg psql -U postgres -d applymate

# Queries
SELECT * FROM applications ORDER BY created_at DESC;
SELECT * FROM scan_history ORDER BY first_seen DESC;
SELECT * FROM pipeline_entries;
```

### Reset DB (deletes all data)
```bash
docker rm -f applymate-pg
docker run -d --name applymate-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=applymate \
  -p 5432:5432 postgres:16-alpine
```

### Rebuild containers
```bash
docker rm -f applymate-pg applymate-redis
# then docker run commands from step 1
```

---

## 🔧 Dev Tips

### Mock Mode (No LLM Key)
Set in `backend/.env`:
```env
LLM_MOCK_MODE=true
```
Generates realistic fake resume data. Good for frontend dev.

### Test API
```bash
# Health
curl http://localhost:8000/api/health

# Upload resume
curl -X POST http://localhost:8000/api/resume/upload \
  -F "file=@resume.pdf"

# Tailor (V3)
curl -X POST http://localhost:8000/api/resume/tailor-v3 \
  -F "resume_id=<id>" \
  -F "job_description=Python developer FastAPI"
```

### Import career-ops data (script)
```bash
cd backend
python scripts/import_career_ops.py \
  --source /path/to/career-ops \
  --user-id your-clerk-id
```

---

## 📁 Project Structure

```
applymate/
├── frontend/                 # Next.js 15
│   ├── app/                  # Pages (app router)
│   ├── components/           # React components
│   └── package.json
│
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── api/routes/       # Endpoints
│   │   ├── services/         # DB, auth, LLM orchestration
│   │   └── workers/          # Celery tasks
│   ├── uploads/              # Resumes & PDFs
│   ├── reports/              # Career-ops markdown reports
│   ├── scripts/              # Import utilities
│   └── requirements.txt
│
├── docs/                     # Docs
├── config/                   # Config files
└── README.md
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `OPENROUTER_API_KEY` | No* | LLM key (*503 if missing, use mock) |
| `LLM_MOCK_MODE` | No | `true` to skip LLM calls |
| `GEMINI_API_KEY` | No | Gemini fallback |
| `CLERK_SECRET_KEY` | No | Production auth |
| `FRONTEND_URL` | No | CORS origin |

---

## 🚢 Deployment

- **Backend**: Railway (auto-deploy from GitHub)
- **Frontend**: Vercel (auto-deploy from GitHub)
- **Database**: Supabase Cloud or Railway Postgres

---

## License

MIT
