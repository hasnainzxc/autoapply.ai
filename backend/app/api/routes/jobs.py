from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.services.database import get_db, Application, get_or_create_credits, Credit, Profile, ApplicationEvent, CreditTransaction
from app.services.auth import get_current_user
from app.schemas.application import JobAnalyze, JobApply
import httpx
import json
import os
from datetime import datetime
import uuid
from bs4 import BeautifulSoup

router = APIRouter()


@router.post("/jobs/analyze")
async def analyze_job(
    job: JobAnalyze,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Analyze job URL and return match score"""
    
    credits = get_or_create_credits(db, current_user)
    
    if credits.balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    credits.balance -= 1
    credits.lifetime_used += 1
    db.commit()
    
    job_description = scrape_job_description(job.job_url)
    
    profile = db.query(Profile).filter(Profile.clerk_id == current_user).first()
    
    if not profile:
        profile = Profile(
            clerk_id=current_user,
            email=f"{current_user}@example.com",
            base_resume="Experienced software engineer with skills in Python, JavaScript, and cloud technologies."
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    user_profile = {
        "base_resume": profile.base_resume or "",
        "full_name": profile.full_name or "",
        "email": profile.email or ""
    }
    
    match_score = await get_match_score(job_description, user_profile)
    
    application = Application(
        user_id=current_user,
        job_url=job.job_url,
        job_title=job.job_title,
        company_name=job.company_name,
        status="analyzed",
        match_score=match_score,
        tailored_resume={
            "summary": f"Matched at {match_score}% to {job.job_title or 'this position'}",
            "key_skills": ["Python", "JavaScript", "SQL"],
            "match_score": match_score
        }
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    event = ApplicationEvent(
        application_id=application.id,
        event_type="job_analyzed",
        message=f"Job analyzed with match score {match_score}%",
        payload={"job_url": job.job_url, "match_score": match_score}
    )
    db.add(event)
    db.commit()
    
    return {
        "status": "completed",
        "application_id": str(application.id),
        "job_url": job.job_url,
        "match_score": match_score,
        "credits_remaining": credits.balance,
        "job_description": job_description[:500] if len(job_description) > 500 else job_description
    }


@router.post("/jobs/apply")
async def apply_to_job(
    job: JobApply,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Queue a job application"""
    
    credits = get_or_create_credits(db, current_user)
    
    if credits.balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    credits.balance -= 1
    credits.lifetime_used += 1
    db.commit()
    
    application = Application(
        user_id=current_user,
        job_url=job.job_url,
        job_title=job.job_title,
        company_name=job.company_name,
        status="queued"
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    transaction = CreditTransaction(
        user_id=current_user,
        amount=-1,
        type="applied",
        description=f"Applied to {job.job_title or job.job_url}"
    )
    db.add(transaction)
    db.commit()
    
    return {
        "status": "queued",
        "application_id": str(application.id),
        "credits_remaining": credits.balance
    }


def scrape_job_description(job_url: str) -> str:
    """Scrape job description from URL"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = httpx.get(job_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return f"Job at {job_url} - Could not fetch details (status {response.status_code})"
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        text = soup.get_text(separator=' ', strip=True)
        
        if len(text) > 5000:
            text = text[:5000]
        
        return text
        
    except Exception as e:
        return f"Job at {job_url} - Error fetching: {str(e)}"


async def get_match_score(job_description: str, user_profile: dict) -> int:
    """Get match score from LLM"""
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    if not openrouter_key or openrouter_key == "your_openrouter_key":
        return 75
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "qwen/qwen-2.5-7b-instruct",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a job matching algorithm. Rate how well the candidate fits the job from 0-100. Return only a number."
                        },
                        {
                            "role": "user",
                            "content": f"Job: {job_description}\n\nCandidate: {user_profile.get('base_resume', '')}"
                        }
                    ],
                    "max_tokens": 10
                },
                timeout=30.0
            )
            result = response.json()
            score_text = result["choices"][0]["message"]["content"]
            score = int(''.join(filter(str.isdigit, score_text))) or 50
            return min(max(score, 0), 100)
    except Exception as e:
        return 50
