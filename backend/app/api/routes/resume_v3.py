"""
JSON-Only Resume Tailoring Routes (V3)
POST /api/resume/tailor-v3 - Full pipeline, returns structured JSON (NO PDF)
GET /api/resume/templates - List available templates
GET /api/resume/{id}/json - Retrieve stored TailoredResumeSchema JSON from DB

Key difference from V2: No PDF generation. Returns TailoredResumeSchema + ATSAnalysis + MatchScoreResult as JSON.
Frontend handles rendering from the structured JSON response.
"""

import json
import os
import uuid
from dataclasses import asdict
from pathlib import Path


from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from app.services.database import get_db, Resume, TailoredResume, ResumeEvent
from app.services.auth import get_current_user
from app.services.llm_orchestrator import LLMOrchestrator
from app.services.ats_analyzer import analyze_resume_for_ats
from app.services.resume_templates import list_templates


router = APIRouter()

UPLOAD_DIR = Path(
    os.getenv("UPLOAD_DIR", "/home/hairzee/prods/applymate/backend/uploads")
)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def log_resume_event(
    db: Session, tailored_resume_id, event_type: str, message: str, payload: dict = None
):
    """Log resume-related events for debugging and tracing"""
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
    """
    Get available resume templates.

    Returns list of template metadata (id, name, description, ats_score).
    Frontend uses this to populate template selection UI.
    """
    return {"templates": list_templates()}


@router.post("/resume/tailor-v3")
async def tailor_resume_v3(
    resume_id: str = Form(None),
    job_description: str = Form(...),
    template: str = Form("modern_tech"),
    profile_data: str = Form(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Tailor resume using the enhanced pipeline — JSON-only, no PDF.

    Steps:
    1. Validate resume ownership and API key
    2. Run full LLM orchestration pipeline (extract → analyze → match → tailor)
    3. Run real ATS heuristics analysis
    4. Store structured result in DB
    5. Return TailoredResumeSchema + ATSAnalysis + MatchScoreResult as JSON

    Frontend receives the complete structured JSON and renders it with the chosen template.
    """
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    # Validate input: must have either resume_id or profile_data
    if not resume_id and not profile_data:
        raise HTTPException(
            status_code=400, detail="Provide either resume_id or profile_data"
        )

    tailored_id = uuid.uuid4()
    orchestrator = LLMOrchestrator(api_key=openrouter_key)

    # Determine resume text source
    if resume_id:
        # Existing flow: lookup resume in DB
        db_resume = (
            db.query(Resume)
            .filter(Resume.id == resume_id, Resume.user_id == current_user)
            .first()
        )

        if not db_resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        if not db_resume.extracted_text:
            raise HTTPException(
                status_code=400, detail="Resume has no extracted text. Please re-upload."
            )

        resume_text = db_resume.extracted_text
    else:
        # Profile-based: construct pseudo-resume text from profile_data JSON
        try:
            profile = json.loads(profile_data)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400, detail="profile_data must be valid JSON"
            )

        resume_text = LLMOrchestrator.construct_profile_text(profile)

    try:
        log_resume_event(
            db,
            tailored_id,
            "started",
            "Starting JSON-only resume tailoring pipeline (V3)",
        )

        # --- Full pipeline: extract → analyze → match → tailor ---
        log_resume_event(
            db, tailored_id, "llm_pipeline", "Running full LLM orchestration pipeline"
        )

        tailored, job_analysis, match_result = await orchestrator.full_pipeline(
            resume_text, job_description
        )

        # --- ATS analysis with real heuristics ---
        log_resume_event(
            db, tailored_id, "ats_analysis", "Running ATS heuristics analysis"
        )
        ats_analysis = analyze_resume_for_ats(tailored, job_analysis)

        # --- Enrich tailored resume with metadata ---
        tailored.template_used = template
        tailored.job_description = job_description
        tailored.ats_score = int(ats_analysis.overall_score)
        tailored.ats_breakdown = ats_analysis.breakdown
        tailored.matched_keywords = ats_analysis.matched_keywords
        tailored.missing_keywords = ats_analysis.missing_keywords
        tailored.optimization_notes = ats_analysis.recommendations

        # --- Persist to DB ---
        log_resume_event(
            db, tailored_id, "saving", "Saving tailored resume JSON to database"
        )
        tailored_record = TailoredResume(
            id=tailored_id,
            user_id=current_user,
            resume_id=resume_id,
            job_description=job_description,
            llm_model="multi-step-orchestrator",
            llm_raw_response=tailored.model_dump_json(indent=2),
            llm_structured_json=tailored.model_dump(mode="json"),
            template_used=template,
            pdf_path="",  # V3: no PDF, store empty string
            status="completed",
        )
        db.add(tailored_record)
        db.commit()

        log_resume_event(
            db,
            tailored_id,
            "completed",
            "JSON-only resume tailoring completed successfully",
        )

        # --- Return structured JSON for frontend rendering ---
        return {
            "status": "success",
            "tailored_resume_id": str(tailored_id),
            "tailored_resume": tailored.model_dump(mode="json"),
            "ats_analysis": asdict(ats_analysis),
            "match_score": match_result.model_dump(),
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


@router.get("/resume/{tailored_id}/json")
async def get_tailored_resume_json(
    tailored_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Retrieve stored TailoredResumeSchema JSON from database.

    Returns the complete structured resume JSON that was generated during
    the tailoring pipeline. Frontend uses this to render the resume with
    the selected template.

    Returns 404 if the tailored resume is not found or belongs to another user.
    """
    tailored = (
        db.query(TailoredResume)
        .filter(
            TailoredResume.id == tailored_id,
            TailoredResume.user_id == current_user,
        )
        .first()
    )

    if not tailored:
        raise HTTPException(status_code=404, detail="Tailored resume not found")

    if not tailored.llm_structured_json:
        raise HTTPException(
            status_code=404,
            detail="No structured JSON found for this tailored resume",
        )

    return {
        "id": str(tailored.id),
        "status": tailored.status,
        "template_used": tailored.template_used,
        "job_description": tailored.job_description,
        "resume_json": tailored.llm_structured_json,
        "created_at": tailored.created_at.isoformat() if tailored.created_at else None,
    }
