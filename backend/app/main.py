import os
from dotenv import load_dotenv

# Load .env BEFORE any module imports (database.py checks DATABASE_URL at import time)
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_backend_dir, ".env"))
load_dotenv()  # also try cwd (project root) — doesn't override

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, users, jobs, applications, credits
from app.api.routes import resumes
from app.api.routes import resume_v2
from app.api.routes import resume_v3
from app.api.routes import opencode
from app.services import opencode_ws
from app.services.database import init_db
from app.services.opencode_monitor import monitor_sidecar


def create_app() -> FastAPI:
    app = FastAPI(
        title="ApplyMate API",
        description="AI Job Application Automation SaaS - Resume Crafting 2.0",
        version="0.2.0",
    )

    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup_event():
        init_db()
        asyncio.create_task(monitor_sidecar())

    app.include_router(auth.router, prefix="/api", tags=["auth"])
    app.include_router(users.router, prefix="/api", tags=["users"])
    app.include_router(jobs.router, prefix="/api", tags=["jobs"])
    app.include_router(applications.router, prefix="/api", tags=["applications"])
    app.include_router(credits.router, prefix="/api", tags=["credits"])
    app.include_router(resumes.router, prefix="/api", tags=["resumes"])
    app.include_router(resume_v2.router, prefix="/api", tags=["resume-v2"])
    app.include_router(resume_v3.router, prefix="/api", tags=["resume-v3"])
    app.include_router(opencode.router, prefix="/api", tags=["opencode"])
    app.include_router(opencode_ws.router)

    @app.get("/api/health")
    async def health_check():
        return {"status": "healthy", "version": "0.2.0", "pipeline": "v2"}

    return app


app = create_app()
