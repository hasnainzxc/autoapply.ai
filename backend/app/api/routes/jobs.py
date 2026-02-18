from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.schemas.application import JobAnalyze, JobApply, TailoredResume
from app.services.supabase import supabase_client
from app.workers.resume_crafter import craft_resume_task, calculate_match_score_task
from celery import group

router = APIRouter()


def get_current_user() -> str:
    """Get current user ID - to be implemented with Clerk"""
    return "placeholder-user-id"


@router.post("/jobs/analyze")
async def analyze_job(
    job: JobAnalyze,
    current_user: str = Depends(get_current_user)
):
    """Analyze job URL and return match score + tailored resume"""
    
    # Check user credits
    credits_response = supabase_client.get_table("credits").select("*").eq("user_id", current_user).execute()
    
    if not credits_response.data or credits_response.data[0].get("balance", 0) < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Trigger async analysis
    task = group(
        calculate_match_score_task.s(job.job_url, current_user),
        craft_resume_task.s(job.job_url, current_user)
    )
    
    task.apply_async()
    
    return {
        "status": "queued",
        "message": "Job analysis started. Check back for results."
    }


@router.post("/jobs/apply")
async def apply_to_job(
    job: JobApply,
    current_user: str = Depends(get_current_user)
):
    """Queue a job application"""
    
    # Check credits
    credits_response = supabase_client.get_table("credits").select("*").eq("user_id", current_user).execute()
    
    if not credits_response.data or credits_response.data[0].get("balance", 0) < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Create application record
    app_response = supabase_client.get_table("applications").insert({
        "user_id": current_user,
        "job_url": job.job_url,
        "job_title": job.job_title,
        "company_name": job.company_name,
        "status": "queued"
    }).execute()
    
    if not app_response.data:
        raise HTTPException(status_code=500, detail="Failed to create application")
    
    application_id = app_response.data[0]["id"]
    
    # Deduct credit
    supabase_client.get_table("credits").update({
        "balance": credits_response.data[0]["balance"] - 1,
        "lifetime_used": credits_response.data[0].get("lifetime_used", 0) + 1
    }).eq("user_id", current_user).execute()
    
    # Record transaction
    supabase_client.get_table("credit_transactions").insert({
        "user_id": current_user,
        "amount": -1,
        "type": "applied",
        "description": f"Applied to {job.job_title or job.job_url}"
    }).execute()
    
    # Queue the application task
    from app.workers.applicator import apply_to_job_task
    apply_to_job_task.apply_async(args=[application_id])
    
    return {
        "status": "queued",
        "application_id": application_id,
        "credits_remaining": credits_response.data[0]["balance"] - 1
    }
