# ApplyMate - AI Job Application Automation SaaS

## System Specification Document

---

## 1. System Architecture

To keep this "sleek" and scalable, I recommend a Decoupled Agentic Architecture.

### The Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 15 + Tailwind + Shadcn | User dashboard |
| Auth | Clerk | User authentication |
| Backend API | FastAPI (Python) | REST API endpoints |
| Database | Supabase (PostgreSQL) | User data, applications |
| Task Queue | Redis + Celery | Background job processing |
| Browser Agent | Playwright + MiniMax | Web automation |
| Scraping | Firecrawl / Playwright | Job description extraction |
| Payments | Stripe (later) | Subscription billing |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │ Dashboard│  │  Jobs   │  │ Applications│  │   Credits   │   │
│  └────┬────┘  └────┬────┘  └──────┬──────┘  └──────┬───────┘   │
└───────┼────────────┼─────────────┼───────────────┼────────────┘
        │            │             │               │
        │    ┌───────┴─────────────┴───────────────┴──────┐
        │    │              API GATEWAY (FastAPI)          │
        │    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
        │    │  │  /auth   │  │  /jobs   │  │ /credits │  │
        │    │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
        │    └───────┼─────────────┼─────────────┼────────┘
        │            │             │             │
        ▼            ▼             ▼             ▼
┌───────────────┐ ┌─────────────────────────────────────────┐
│    Clerk      │ │           TASK QUEUE (Redis)            │
│  (Auth)       │ │  ┌─────────────────────────────────┐   │
│               │ │  │ Celery Workers                   │   │
│               │ │  │  ├─ Resume Crafter (OpenRouter) │   │
│               │ │  │  ├─ Cover Letter Generator      │   │
│               │ │  │  └─ Browser Applicator (MiniMax)│   │
└───────────────┘ │  └─────────────────────────────────┘   │
                  └──────────────────┬──────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   SUPABASE (DB)      │
                          │  ┌───────────────┐   │
                          │  │   profiles    │   │
                          │  │   applications│   │
                          │  │   credits     │   │
                          │  └───────────────┘   │
                          └─────────────────────┘
```

---

## 2. Infrastructure & Modern Design

### UI/UX Principles

For a "sleek" feel, your UI should focus on **Transparency**. The user wants to see the AI "thinking" and "moving" through the web.

- **Bento Grid Dashboard**: Use a bento-style layout to show "Active Scrapes," "Resumes Crafted," and "Success Rate."
- **Real-time Logs**: Use WebSockets to stream the agent's progress (e.g., "Agent navigated to Workday portal...") to the UI.
- **Glassmorphism**: Use subtle blurs and dark mode by default to give it that high-end AI tool aesthetic.
- **Match Score**: Show 0-100% compatibility score before applying

### Command Center UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  ApplyMate          Credits: 45  [User Avatar ▼]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           BENTO GRID DASHBOARD                              │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  │   Active    │ │   Success   │ │      Credit Balance     ││
│  │  │   Agents    │ │    Rate     │ │                         ││
│  │  │      3      │ │    78%      │ │    ████████░░  8/10    ││
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  │  ┌─────────────────────────────────────────────────────────┐│
│  │  │              RECENT APPLICATIONS                        ││
│  │  │  ┌─────────────────────────────────────────────────────┐││
│  │  │  │ [●] Senior DevOps Engineer - AWS    92%  Applied   │││
│  │  │  │ [●] Backend Engineer - Stripe         85%  Drafting│││
│  │  │  │ [○] ML Engineer - OpenAI              78%  Queued   │││
│  │  │  └─────────────────────────────────────────────────────┘││
│  │  └─────────────────────────────────────────────────────────┘│
│  └─────────────────────────────────────────────────────────────┘
│                                                                  │
│  [+ Add Job]  [Import Resume]  [Settings]                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema (Supabase)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (extends Clerk)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    base_resume TEXT,
    base_cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit System
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    lifetime_purchased INTEGER DEFAULT 0,
    lifetime_used INTEGER DEFAULT 0,
    subscription_tier TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Job Applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_url TEXT NOT NULL,
    job_title TEXT,
    company_name TEXT,
    company_logo TEXT,
    location TEXT,
    salary_range TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    match_score INTEGER,
    tailored_resume JSONB,
    cover_letter TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application Status: queued → scraping → analyzing → drafting → applying → confirmed → failed

-- Credit Transactions
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    stripe_payment_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
```

---

## 4. API Endpoints (FastAPI)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/clerk` | Handle Clerk webhooks |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile, resume, cover letter |
| POST | `/api/users/me/resume` | Upload base resume |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs for current user |
| POST | `/api/jobs/analyze` | Analyze job (match score) |
| POST | `/api/jobs/apply` | Queue job application |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List user's applications |
| GET | `/api/applications/{id}` | Get application details |
| DELETE | `/api/applications/{id}` | Cancel application |

### Credits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credits/balance` | Get credit balance |
| POST | `/api/credits/purchase` | Purchase credits (Stripe) |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `/ws/agent/{application_id}` | Real-time agent progress |

---

## 5. Task Queue (Celery)

### Celery Tasks

```python
# tasks/resume_crafter.py
@celery_app.task(bind=True, max_retries=3)
def craft_resume_task(self, application_id: str):
    """Analyzes job and crafts tailored resume"""
    # 1. Scrape job description
    # 2. Send to LLM with user's base resume
    # 3. Generate tailored resume JSON
    # 4. Update application status
    pass

# tasks/cover_letter.py
@celery_app.task(bind=True, max_retries=3)
def generate_cover_letter_task(self, application_id: str):
    """Generates personalized cover letter"""
    pass

# tasks/applicator.py
@celery_app.task(bind=True, max_retries=2)
def apply_to_job_task(self, application_id: str):
    """Browser automation to apply"""
    # 1. Launch browser with proxy
    # 2. Navigate to job portal
    # 3. Fill forms with tailored data
    # 4. Submit application
    pass
```

### Status State Machine

```
queued → scraping → analyzing → crafting → applying → confirmed
                                         ↓
                                      failed
```

---

## 6. LLM Strategy

| Task | Initial (Cheap) | Later (If Needed) |
|------|-----------------|-------------------|
| Resume modification | OpenRouter (Qwen 3B) | MiniMax |
| Cover letter | OpenRouter | MiniMax |
| Match scoring | OpenRouter | DeepSeek |
| Browser agent | - | MiniMax 2.5 |

### OpenRouter Configuration (Initial)

```yaml
openrouter:
  api_key: "${OPENROUTER_API_KEY}"
  base_url: "https://openrouter.ai/api/v1"
  
  # Cost-effective models
  models:
    resume: "qwen/qwen-2.5-7b-instruct"
    cover_letter: "qwen/qwen-2.5-7b-instruct"
    scoring: "qwen/qwen-2.5-7b-instruct"
  
  # Fallback to MiniMax if needed
  fallback:
    enabled: true
    model: "minimax/minimax-text-01"
```

---

## 7. Security & Anti-Bot Measures

### Human-like Behavior

```python
# Browser automation must include:
HUMAN_TYPING_SPEED = {
    "min_delay": 50,    # ms between characters
    "max_delay": 150,
    "error_rate": 0.05, # 5% typo rate (backspace correction)
}

# Random delays between actions
RANDOM_DELAYS = {
    "page_load": (1, 3),      # seconds
    "button_click": (0.5, 2),
    "form_submission": (2, 5),
}
```

### Proxy Management

- Use Bright Data or ScraperAPI
- Rotate IPs per application
- User-Agent rotation

---

## 8. MiniMax 2.5 Agent Instructions

When working with the ApplyMate agent, always follow these MiniMax-specific guidelines:

### Model Configuration

- **Primary Model**: `abab6.5-chat`
- **API Endpoint**: `https://api.minimax.chat/v1`
- **Context Window**: 245,760 tokens (~200k) - Large enough for full job descriptions

### Temperature Settings

| Task | Temperature | Rationale |
|------|-------------|-----------|
| Cover Letter | 0.7 | Higher creativity for engaging, personalized content |
| Resume Tailoring | 0.2 | Lower precision to maintain accuracy and ATS compatibility |
| General | 0.5 | Balanced default |

### Context Window Instructions

⚠️ **IMPORTANT**: MiniMax handles large tokens efficiently. Before writing:

1. **Ingest the ENTIRE Job Description** - Don't truncate
2. **Ingest the ENTIRE User Bio** - Include all experience and skills
3. **Extract ALL keywords** - Especially ATS-specific terms

The agent should NOT summarize or truncate job descriptions. Pass the full content to MiniMax for optimal matching.

### JSON Output Format

All resume crafting outputs MUST be valid JSON:

```json
{
  "tailored_summary": "...",
  "key_skills": ["..."],
  "work_experience": [...],
  "education": [...],
  "ats_score_estimate": 85
}
```

---

## 9. Project Structure

```
applymate/
├── backend/                    # FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── jobs.py
│   │   │   │   ├── applications.py
│   │   │   │   └── credits.py
│   │   │   ├── deps.py
│   │   │   └── main.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── job.py
│   │   │   └── application.py
│   │   ├── services/
│   │   │   ├── supabase.py
│   │   │   └── stripe.py
│   │   └── workers/
│   │       ├── resume_crafter.py
│   │       └── applicator.py
│   ├── celery_app.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # Next.js 15
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── jobs/
│   │   │   ├── applications/
│   │   │   └── settings/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   └── dashboard/
│   └── lib/
│
├── scraper/                    # Standalone scraper
│   ├── job_extractor.py
│   └── requirements.txt
│
├── config/
│   ├── config.yaml
│   └── openclaw_config.json
│
├── docs/
│   ├── system_spec.md         # This file
│   └── api_docs.md
│
└── README.md
```

---

## 10. Implementation Phases

### Phase 1: MVP (Current)

- [x] Job scraper with Playwright
- [x] MiniMax client for resume tailoring
- [x] Basic CLI runner

### Phase 2: Backend API (In Progress)

- [ ] FastAPI setup with Supabase
- [ ] Clerk authentication
- [ ] User profile management
- [ ] Job analysis endpoint

### Phase 3: Frontend

- [ ] Next.js 15 setup with Clerk
- [ ] Dashboard with bento grid
- [ ] Application tracking UI
- [ ] Real-time WebSocket logs

### Phase 4: Task Queue

- [ ] Redis + Celery setup
- [ ] Resume crafting worker
- [ ] Cover letter worker

### Phase 5: Payments (Later)

- [ ] Stripe integration
- [ ] Credit purchase flow
- [ ] Subscription management

### Phase 6: Browser Automation

- [ ] Full auto-apply with MiniMax
- [ ] Proxy rotation
- [ ] Human-like behavior

---

*Last Updated: 2026-02-18*
*Configuration: See config/config.yaml*
