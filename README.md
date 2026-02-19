# ApplyMate

AI-powered job application automation platform that streamlines your job search with intelligent resume tailoring, cover letter generation, and automated applications.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009974)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Smart Resume Tailoring** - AI analyzes job descriptions and optimizes your resume for maximum match scores
- **Cover Letter Generator** - Personalized cover letters written in your voice
- **Auto-Apply** - Automated form filling and job application submission
- **Application Tracking** - Dashboard to track all your applications and their status
- **Template Selection** - Choose from professional resume templates (Tech, Creative, Business, General)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 18, Tailwind CSS |
| Authentication | Clerk |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase or local Docker) |
| Task Queue | Redis + Celery |
| AI/LLM | OpenRouter |
| Browser Automation | Playwright |
| PDF Generation | WeasyPrint |

---

## 🚀 Quick Start (Local Development)

### 1. Start Infrastructure (Docker)

```bash
# Redis (for task queue)
docker run -d --name applymate-redis -p 6379:6379 redis:alpine

# PostgreSQL (database)
docker run -d --name applymate-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=applymate \
  -p 5432:5432 postgres:alpine
```

### 2. Initialize Database Tables

```bash
docker exec applymate-db psql -U postgres -d applymate -c "
CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';

-- Core tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    base_resume TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE,
    balance INTEGER DEFAULT 0,
    lifetime_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    amount INTEGER,
    type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    job_url TEXT,
    job_title VARCHAR(255),
    company_name VARCHAR(255),
    company_logo TEXT,
    location VARCHAR(255),
    salary_range VARCHAR(100),
    status VARCHAR(50) DEFAULT 'queued',
    match_score INTEGER,
    tailored_resume JSONB,
    cover_letter TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume tailoring tables
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    original_file_path TEXT,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tailored_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    resume_id UUID,
    job_description TEXT,
    llm_model TEXT,
    llm_raw_response TEXT,
    llm_structured_json JSONB,
    template_used TEXT,
    pdf_path TEXT,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tailored_resume_id UUID,
    event_type TEXT NOT NULL,
    message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"
```

### 3. Configure Environment

Create `backend/.env`:
```env
# Database (local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applymate

# LLM (required for resume tailoring)
OPENROUTER_API_KEY=your_openrouter_key_here

# Auth (optional for local dev - uses fallback)
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_KEY=your_jwt_secret

# Task Queue
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### 4. Install Dependencies & Run

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Create uploads directory
mkdir -p uploads

# Start backend
PYTHONPATH=/home/hairzee/prods/applymate/backend python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8000/api/health

# Analyze a job
curl -X POST http://localhost:8000/api/jobs/analyze \
  -H "Content-Type: application/json" \
  -d '{"job_url": "https://example.com/job", "job_title": "Software Engineer"}'

# Upload a resume (PDF or DOCX)
curl -X POST http://localhost:8000/api/resume/upload \
  -F "file=@/path/to/resume.pdf"

# Tailor resume (requires OPENROUTER_API_KEY)
curl -X POST http://localhost:8000/api/resume/tailor \
  -F "resume_id=<resume_id>" \
  -F "job_description=Python developer with FastAPI"

# Download tailored PDF
curl -X GET http://localhost:8000/api/resume/<tailored_resume_id>/download
```

---

## 📋 API Endpoints

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/jobs/analyze` | Analyze job URL, returns match score |
| POST | `/api/jobs/apply` | Queue job application |
| GET | `/api/credits/balance` | Get credit balance |
| GET | `/api/applications` | List user applications |

### Resume Tailoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload PDF/DOCX, extract text |
| POST | `/api/resume/tailor` | Generate tailored resume via LLM |
| GET | `/api/resume/{id}/download` | Download generated PDF |
| GET | `/api/resume/events/{id}` | Get event logs for resume |

### User & Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get user profile |
| POST | `/api/webhooks/clerk` | Clerk webhook handler |

---

## 🔧 Working with Docker

### Start containers
```bash
docker start applymate-redis applymate-db
```

### Stop containers
```bash
docker stop applymate-redis applymate-db
```

### View logs
```bash
docker logs applymate-db
docker logs applymate-redis
```

### Access PostgreSQL directly
```bash
docker exec -it applymate-db psql -U postgres -d applymate

# Example queries
SELECT * FROM applications;
SELECT * FROM resumes;
SELECT * FROM resume_events;
```

### Rebuild containers (if needed)
```bash
docker rm -f applymate-redis applymate-db
# Then run the docker run commands from step 1
```

---

## 📁 Project Structure

```
applymate/
├── frontend/                 # Next.js 15 frontend
│   ├── app/                # App router pages
│   ├── components/         # React components
│   └── package.json
│
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/routes/   # API endpoints (jobs, resumes, applications, etc.)
│   │   ├── services/      # Database, auth, supabase services
│   │   └── workers/       # Celery tasks
│   ├── uploads/           # Uploaded resumes & generated PDFs
│   ├── celery_app.py      # Celery configuration
│   └── requirements.txt
│
├── docs/                  # Documentation
│   └── LOCAL_SETUP.md    # Detailed local setup guide
│
├── config/                # Configuration files
└── README.md
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENROUTER_API_KEY` | Yes* | For resume tailoring (*returns 503 if missing) |
| `CLERK_SECRET_KEY` | No | For production auth |
| `CLERK_JWT_KEY` | No | For JWT verification |
| `REDIS_URL` | No | For Celery task queue |

---

## 🚢 Deployment

### Production (Supabase + Railway/Render)

1. Use Supabase Cloud instead of local PostgreSQL
2. Set `DATABASE_URL` to Supabase connection string
3. Set `OPENROUTER_API_KEY` for LLM calls
4. Deploy backend to Railway/Render/Vercel

---

## License

MIT License - see LICENSE for details.
