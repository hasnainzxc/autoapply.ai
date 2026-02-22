from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, users, jobs, applications, credits
from app.api.routes import resumes
from app.services.database import init_db
import os
from dotenv import load_dotenv

load_dotenv()


def create_app() -> FastAPI:
    app = FastAPI(
        title="ApplyMate API",
        description="AI Job Application Automation SaaS",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup_event():
        init_db()

    app.include_router(auth.router, prefix="/api", tags=["auth"])
    app.include_router(users.router, prefix="/api", tags=["users"])
    app.include_router(jobs.router, prefix="/api", tags=["jobs"])
    app.include_router(applications.router, prefix="/api", tags=["applications"])
    app.include_router(credits.router, prefix="/api", tags=["credits"])
    app.include_router(resumes.router, prefix="/api", tags=["resumes"])

    @app.get("/api/health")
    async def health_check():
        return {"status": "healthy", "version": "0.1.0"}

    return app


app = create_app()
