"""
Enhanced Resume Tailoring Routes - Uses new pipeline
POST /api/resume/tailor-v2 - Tailor resume with new pipeline
GET /api/resume/templates - List available templates
POST /api/resume/analyze - Analyze resume against job (without tailoring)
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from pathlib import Path

from app.services.database import get_db, Resume, TailoredResume, ResumeEvent
from app.services.auth import get_current_user
from app.services.resume_parser import ResumeParser, extract_text_from_file
from app.services.llm_orchestrator import LLMOrchestrator
from app.services.ats_analyzer import ATSAnalyzer, analyze_resume_for_ats
from app.services.pdf_generator import generate_resume_pdf
from app.services.resume_templates import list_templates
from app.services.resume_schema import ResumeSchema, JobAnalysis, TailoredResumeSchema

router = APIRouter()

UPLOAD_DIR = Path(
    os.getenv("UPLOAD_DIR", "/home/hairzee/prods/applymate/backend/uploads")
)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def log_resume_event(
    db: Session, tailored_resume_id, event_type: str, message: str, payload: dict = None
):
    """Log resume-related events for debugging"""
    event = ResumeEvent(
        tailored_resume_id=tailored_resume_id,
        event_type=event_type,
        message=message,
        payload=payload or {},
    )
    db.add(event)
    db.commit()


@router.get("/resume/templates")
async def get_templates():
    """Get available resume templates"""
    return {"templates": list_templates()}


@router.post("/resume/tailor-v2")
async def tailor_resume_v2(
    resume_id: str = Form(...),
    job_description: str = Form(...),
    template: str = Form("modern_tech"),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Tailor resume using the new enhanced pipeline.

    Steps:
    1. Parse resume into structured JSON
    2. Analyze job description for keywords
    3. Calculate match score
    4. Tailor resume with LLM
    5. Generate PDF
    """
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user)
        .first()
    )

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    tailored_id = uuid.uuid4()

    try:
        log_resume_event(
            db, tailored_id, "started", "Starting resume tailoring pipeline"
        )

        log_resume_event(
            db, tailored_id, "parsing", "Parsing resume into structured JSON"
        )
        parser = ResumeParser(resume.extracted_text or "")
        structured_resume = parser.parse()

        log_resume_event(db, tailored_id, "llm_call", "Calling LLM orchestrator")
        orchestrator = LLMOrchestrator(api_key=openrouter_key)

        job_analysis = await orchestrator.step2_analyze_job(job_description)
        match_result = await orchestrator.step3_calculate_match(
            structured_resume, job_analysis
        )
        tailored = await orchestrator.step4_tailor_resume(
            structured_resume, job_analysis, match_result
        )

        tailored.template_used = template
        tailored.ats_score = match_result.overall_score
        tailored.matched_keywords = match_result.matched_keywords
        tailored.missing_keywords = match_result.missing_keywords
        tailored.job_description = job_description

        ats_analysis = analyze_resume_for_ats(structured_resume, job_analysis)
        tailored.ats_breakdown = ats_analysis.breakdown
        tailored.optimization_notes = ats_analysis.recommendations

        log_resume_event(db, tailored_id, "pdf_generating", "Generating PDF")
        pdf_bytes, pdf_path = generate_resume_pdf(tailored, str(tailored_id))

        tailored_record = TailoredResume(
            id=tailored_id,
            user_id=current_user,
            resume_id=resume_id,
            job_description=job_description,
            llm_model="multi-step-orchestrator",
            llm_raw_response=json.dumps(tailored.model_dump(), indent=2),
            llm_structured_json=tailored.model_dump(),
            template_used=template,
            pdf_path=pdf_path,
            status="completed",
        )
        db.add(tailored_record)
        db.commit()

        log_resume_event(
            db, tailored_id, "completed", "Resume tailoring completed successfully"
        )

        return {
            "status": "success",
            "tailored_resume_id": str(tailored_id),
            "pdf_path": pdf_path,
            "ats_score": tailored.ats_score,
            "matched_keywords": tailored.matched_keywords[:10],
            "missing_keywords": tailored.missing_keywords[:10],
            "ats_breakdown": tailored.ats_breakdown,
            "optimization_notes": tailored.optimization_notes[:3],
            "job_analysis": {
                "job_title": job_analysis.job_title,
                "required_skills": job_analysis.required_skills[:5],
                "is_weak_description": job_analysis.is_weak_description,
            },
        }

    except Exception as e:
        log_resume_event(
            db, tailored_id, "error", str(e), {"error_type": type(e).__name__}
        )

        error_record = TailoredResume(
            id=tailored_id,
            user_id=current_user,
            resume_id=resume_id,
            job_description=job_description,
            llm_model="multi-step-orchestrator",
            llm_raw_response="",
            llm_structured_json={},
            template_used=template,
            pdf_path="",
            status="failed",
        )
        db.add(error_record)
        db.commit()

        raise HTTPException(status_code=500, detail=f"Tailoring failed: {str(e)}")


@router.post("/resume/analyze-v2")
async def analyze_resume_v2(
    resume_id: str = Form(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Analyze resume against job description without generating PDF.
    Useful for previewing match score before tailoring.
    """
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user)
        .first()
    )

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        parser = ResumeParser(resume.extracted_text or "")
        structured_resume = parser.parse()

        orchestrator = LLMOrchestrator(api_key=openrouter_key)

        job_analysis = await orchestrator.step2_analyze_job(job_description)
        match_result = await orchestrator.step3_calculate_match(
            structured_resume, job_analysis
        )

        ats_analysis = analyze_resume_for_ats(structured_resume, job_analysis)

        return {
            "match_score": match_result.overall_score,
            "keyword_match_rate": match_result.keyword_match_rate,
            "matched_keywords": match_result.matched_keywords,
            "missing_keywords": match_result.missing_keywords,
            "gap_analysis": match_result.gap_analysis,
            "recommendations": match_result.recommendations,
            "ats_breakdown": ats_analysis.breakdown,
            "ats_issues": ats_analysis.issues,
            "job_analysis": {
                "job_title": job_analysis.job_title,
                "required_skills": job_analysis.required_skills,
                "preferred_skills": job_analysis.preferred_skills,
                "tools_and_technologies": job_analysis.tools_and_technologies,
                "is_weak_description": job_analysis.is_weak_description,
                "weak_description_notes": job_analysis.weak_description_notes,
            },
            "resume_summary": {
                "name": structured_resume.basics.name
                if structured_resume.basics
                else "Unknown",
                "experience_count": len(structured_resume.work),
                "skill_categories": [s.name for s in structured_resume.skills]
                if structured_resume.skills
                else [],
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/resume/{tailored_id}/download")
async def download_tailored_resume(
    tailored_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Download tailored resume PDF"""
    tailored = (
        db.query(TailoredResume)
        .filter(
            TailoredResume.id == tailored_id, TailoredResume.user_id == current_user
        )
        .first()
    )

    if not tailored:
        raise HTTPException(status_code=404, detail="Tailored resume not found")

    if not tailored.pdf_path or not os.path.exists(tailored.pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(
        path=tailored.pdf_path,
        filename=f"tailored_resume_{tailored_id}.pdf",
        media_type="application/pdf",
    )


@router.get("/resume/{tailored_id}")
async def get_tailored_resume(
    tailored_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Get tailored resume details"""
    tailored = (
        db.query(TailoredResume)
        .filter(
            TailoredResume.id == tailored_id, TailoredResume.user_id == current_user
        )
        .first()
    )

    if not tailored:
        raise HTTPException(status_code=404, detail="Tailored resume not found")

    return {
        "id": str(tailored.id),
        "status": tailored.status,
        "template_used": tailored.template_used,
        "pdf_path": tailored.pdf_path,
        "job_description": tailored.job_description,
        "llm_structured_json": tailored.llm_structured_json,
        "created_at": tailored.created_at.isoformat() if tailored.created_at else None,
    }


import json
