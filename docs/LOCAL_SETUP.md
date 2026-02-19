# ApplyMate - Local Development Setup

## Quick Start

### 1. Start Infrastructure (Docker)

```bash
# Redis
docker run -d --name applymate-redis -p 6379:6379 redis:alpine

# PostgreSQL  
docker run -d --name applymate-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=applymate -p 5432:5432 postgres:alpine
```

### 2. Initialize Database Tables

```bash
docker exec applymate-db psql -U postgres -d applymate -c "
CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';

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

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applymate
OPENROUTER_API_KEY=your_openrouter_key  # Required for resume tailoring
CLERK_SECRET_KEY=your_clerk_key
CLERK_JWT_KEY=your_jwt_secret
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### 4. Install Dependencies & Start Backend

```bash
cd backend
pip install -r requirements.txt
PYTHONPATH=/home/hairzee/prods/applymate/backend python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Core
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/jobs/analyze` | POST | Analyze job URL, returns match score |
| `/api/jobs/apply` | POST | Queue job application |
| `/api/credits/balance` | GET | Get credit balance |
| `/api/applications` | GET | List user applications |

### Resume Tailoring
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resume/upload` | POST | Upload PDF/DOCX, extract text |
| `/api/resume/tailor` | POST | Generate tailored resume via LLM |
| `/api/resume/{id}/download` | GET | Download generated PDF |
| `/api/resume/events/{id}` | GET | Get event logs for resume |

### User
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get user profile |
| `/api/webhooks/clerk` | POST | Clerk webhook handler |

## Testing

```bash
# Analyze a job
curl -X POST http://localhost:8000/api/jobs/analyze \
  -H "Content-Type: application/json" \
  -d '{"job_url": "https://example.com/job", "job_title": "Engineer"}'

# Upload resume (PDF or DOCX)
curl -X POST http://localhost:8000/api/resume/upload \
  -F "file=@/path/to/resume.pdf"

# Tailor resume (requires OPENROUTER_API_KEY)
curl -X POST http://localhost:8000/api/resume/tailor \
  -F "resume_id=<resume_id>" \
  -F "job_description=Looking for Python developer with FastAPI"

# Download tailored PDF
curl -X GET http://localhost:8000/api/resume/<tailored_resume_id>/download

# Check resume events
curl http://localhost:8000/api/resume/events/<tailored_resume_id>

# Check credits
curl http://localhost:8000/api/credits/balance

# List applications
curl http://localhost:8000/api/applications
```

## Architecture

- **Database**: SQLAlchemy + PostgreSQL (local Docker)
- **Auth**: Clerk JWT with dev fallback to `test-user-123`
- **LLM**: OpenRouter (required for resume tailoring - returns 503 if missing)
- **Scraping**: BeautifulSoup + httpx (sync for MVP)
- **PDF Generation**: WeasyPrint
- **File Storage**: Local filesystem (`backend/uploads/`)
- **Queue**: Celery + Redis (async tasks - not used in MVP flow)

## Resume Tailoring Flow

1. Upload resume → `POST /api/resume/upload`
2. Get `resume_id` from response
3. Tailor for job → `POST /api/resume/tailor` (requires OPENROUTER_API_KEY)
4. Download PDF → `GET /api/resume/{id}/download`
5. Check events → `GET /api/resume/events/{id}`

## Event Logs

All resume operations are logged to `resume_events` table:
- `upload_started` → `extraction_completed` → `upload_completed`
- `tailoring_started` → `llm_response_received` → `llm_validated` → `tailoring_completed`
- `tailoring_failed` (on error)
