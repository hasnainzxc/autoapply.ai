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
| Database | Supabase (PostgreSQL) |
| Task Queue | Redis + Celery |
| AI/LLM | MiniMax API |
| Browser Automation | Playwright |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL (Supabase)
- Redis (for task queue)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/applymate.git
cd applymate
```

2. **Set up Python virtual environment**

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. **Set up Frontend**

```bash
cd frontend
npm install
```

4. **Configure Environment Variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
# Frontend (.env.local in frontend/)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend (.env in backend/)
MINIMAX_API_KEY=your_minimax_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

5. **Run the development servers**

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
uvicorn app.main:app --reload
```

## Project Structure

```
applymate/
├── frontend/                 # Next.js 15 frontend
│   ├── app/                # App router pages
│   │   ├── page.tsx       # Landing page with job flow
│   │   ├── (auth)/        # Auth routes (sign-in, sign-up)
│   │   └── (dashboard)/   # Protected dashboard
│   ├── components/         # React components
│   │   └── dashboard/     # Dashboard widgets
│   ├── middleware.ts      # Clerk auth middleware
│   └── package.json
│
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/routes/   # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── workers/       # Celery tasks
│   │   └── main.py       # FastAPI app
│   ├── celery_app.py      # Celery configuration
│   └── requirements.txt
│
├── src/                   # Standalone scraper (CLI)
│   ├── config.py
│   ├── job_scraper.py
│   ├── minimax_client.py
│   └── logger.py
│
├── config/                # Configuration files
│   └── config.yaml
│
├── docs/                  # Documentation
│   └── system_spec.md
│
├── requirements.txt       # Root Python dependencies
├── run.py                # CLI runner for scraper
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/clerk` | Handle Clerk webhooks |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile, resume, cover letter |

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

## User Flow

1. **Landing** - User visits homepage and enters job URL
2. **Template Selection** - User chooses resume template (Tech, Creative, Business, General)
3. **Authentication** - If not signed in, user signs up/in
4. **Processing** - AI scrapes job, tailors resume, generates cover letter
5. **Application** - Auto-fills and submits application
6. **Dashboard** - Track all applications and their status

## Application Status States

```
queued → scraping → analyzing → crafting → applying → confirmed
                                              ↓
                                           failed
```

## Security

- All API keys are stored in environment variables
- Clerk handles authentication securely
- Supabase RLS (Row Level Security) enabled
- CORS configured for specific domains only
- No secrets are committed to version control

### Security Best Practices

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Use different keys for dev/prod** - Use test keys in development
3. **Rotate API keys regularly** - Especially MiniMax and Clerk keys
4. **Enable 2FA on Clerk** - For admin accounts

## Deployment

### Vercel (Frontend)

```bash
cd frontend
vercel deploy
```

### Railway/Render (Backend)

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Supabase

Run migrations in `docs/schema.sql` to set up the database.

## License

MIT License - see LICENSE for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
