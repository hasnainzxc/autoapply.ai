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
import re
import uuid
from dataclasses import asdict
from pathlib import Path


from fastapi import APIRouter, Depends, HTTPException, Form, Query
from fastapi.responses import HTMLResponse, Response, FileResponse
from sqlalchemy.orm import Session

from app.services.database import get_db, Resume, TailoredResume, ResumeEvent
from app.services.auth import get_current_user
from app.services.llm_orchestrator import LLMOrchestrator
from app.services.ats_analyzer import analyze_resume_for_ats
from app.services.resume_templates import list_templates, render_resume
from app.services.resume_schema import TailoredResumeSchema
from app.services.pdf_generator import generate_resume_pdf


router = APIRouter()

UPLOAD_DIR = Path(
    os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"))
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


def _extract_profile_from_raw_text(text: str) -> dict:
    """Extract basic profile info from raw resume text for mock mode.
    
    Raw resume text from PDF extraction typically has:
    - First 1-3 lines: Name
    - Near top: email address, phone number, location
    - Somewhere: Skills section with comma-separated list
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Helper: check if a line looks like a real name (not a filename/UID/URL)
    def _looks_like_name(line: str) -> bool:
        if not line or len(line) < 3 or len(line) > 50:
            return False
        # Skip lines with file extensions, URLs, UUIDs, emails
        if re.search(r'\.(pdf|docx|txt|png|jpg)$', line, re.IGNORECASE):
            return False
        if re.search(r'https?://|www\.', line, re.IGNORECASE):
            return False
        if re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', line):
            return False
        if re.search(r'^[a-z0-9_-]{8,}$', line):  # user IDs, hashes
            return False
        if re.search(r'^[a-z0-9]+[-_][a-z0-9]+$', line):  # kebab-case IDs
            return False
        # Should have at least 2 words with capital letters
        words = line.split()
        if len(words) >= 2 and sum(1 for w in words if w[0].isupper()) >= 1:
            return True
        if len(words) >= 2 and sum(1 for w in words if w[0].isalpha()) >= 1:
            return True
        return False
    
    # Find name: scan first 5 lines for something that looks like a name
    name = ""
    for line in lines[:5]:
        if _looks_like_name(line):
            name = line
            break
    if not name:
        name = lines[0] if lines else ""  # fallback to first line
    
    # Email
    email = ""
    for line in lines[:30]:
        m = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', line)
        if m:
            email = m.group()
            break
    if not email:
        m = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
        if m:
            email = m.group()
    
    # Phone
    phone = ""
    for line in lines[:30]:
        m = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', line)
        if m:
            phone = m.group()
            break
    
    # Location: look for "City, State" or "City, Country" pattern
    location = ""
    state_abbrs = 'CA|NY|TX|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|IA|MS|AR|KS|UT|NV|NM|WV|NE|ID|HI|ME|NH|RI|VT|ND|SD|DE|AK|MT|WY'
    for line in lines[1:15]:
        line_clean = line.strip().strip(',').strip()
        # "City, ST" pattern
        if re.match(r'^[A-Z][a-zA-Z\s]+,?\s*(' + state_abbrs + r')', line_clean):
            location = line_clean
            break
        # "City, Country" pattern
        if re.match(r'^[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+$', line_clean):
            if len(line_clean) > 4 and len(line_clean) < 50:
                location = line_clean
                break
        # "Remote" anywhere in first lines
        if 'remote' in line_clean.lower() and len(line_clean) < 20:
            location = 'Remote'
    
    # Skills section
    skills = []
    in_skills = False
    skill_headers = ['skills', 'technical skills', 'core competencies', 'key skills',
                     'technologies', 'tech stack', 'tools']
    section_stops = ['experience', 'education', 'projects', 'work ', 'work experience',
                     'employment', 'certifications', 'publications', 'languages', 'references']
    for line in lines:
        ll = line.lower()
        if any(ll.startswith(sk) or ll.strip(':').startswith(sk) for sk in skill_headers):
            in_skills = True
            continue
        if in_skills:
            if any(ll.startswith(s) for s in section_stops):
                break
            if len(line) < 2:
                continue
            # Split by comma, pipe, bullet, or newline
            for s in re.split(r'[,|]\s*', line):
                s = s.strip().strip('•·●▪►-').strip()
                if s and len(s) > 1 and len(s) < 50 and s not in skills:
                    if not any(s.lower().startswith(w) for w in ['skills', 'technical', 'core',
                            'proficient', 'advanced', 'intermediate']):
                        skills.append(s)
    
    # Current role (first role-like mention near top, after name/email)
    current_role = ""
    role_indicators = ['engineer', 'developer', 'architect', 'manager', 'director',
                       'lead', 'analyst', 'designer', 'scientist', 'consultant',
                       'specialist', 'coordinator', 'administrator', 'supervisor']
    section_headers = ['skills', 'education', 'projects', 'experience', 'summary',
                       'certifications', 'profile', 'objective']
    for line in lines[1:10]:
        ll = line.lower()
        if any(w in ll for w in role_indicators):
            if not any(ll.startswith(s) for s in section_headers):
                current_role = line.strip()
                break
    
    # Summary section
    summary = ""
    in_summary = False
    for line in lines:
        ll = line.lower()
        if ll.startswith('summary') or ll.startswith('professional summary') or ll.startswith('profile:'):
            in_summary = True
            continue
        if in_summary:
            if any(ll.startswith(s) for s in section_stops + ['skills']):
                break
            summary = (summary + " " + line) if summary else line
    
    # Estimate experience years from work history
    exp_years = 0
    in_experience = False
    date_range_pattern = re.compile(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[–\-to]+\s*(present|current|now|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})', re.IGNORECASE)
    for line in lines:
        ll = line.lower()
        if any(ll.startswith(s) for s in ['experience', 'work experience', 'employment', 'work history', 'professional experience']):
            in_experience = True
            continue
        if in_experience:
            if any(ll.startswith(s) for s in ['education', 'projects', 'certifications', 'skills']):
                break
            # Count date ranges to estimate years
            if date_range_pattern.search(line):
                exp_years += 1
    
    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "skills": skills[:20],
        "summary": summary,
        "current_role": current_role,
        "location": location,
        "experience_years": exp_years,
    }


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
        
        # In mock mode, pre-extract profile from raw text for realistic responses
        if os.getenv("LLM_MOCK_MODE") == "true":
            profile = _extract_profile_from_raw_text(resume_text)
            orchestrator._mock_profile = profile
    else:
        # Profile-based: construct pseudo-resume text from profile_data JSON
        try:
            profile = json.loads(profile_data)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400, detail="profile_data must be valid JSON"
            )

        resume_text = LLMOrchestrator.construct_profile_text(profile)
        orchestrator._mock_profile = profile

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

        # --- Apply defaults for missing fields ---
        if not tailored.basics or not tailored.basics.name:
            tailored.basics.name = "Muhammad Yousaf"
        if not tailored.basics or not tailored.basics.phone:
            tailored.basics.phone = "03214417723"
        if not tailored.basics or not tailored.basics.summary:
            tailored.basics.summary = "React Developer with 2 years of experience building responsive web applications. Proficient in modern React ecosystem including Hooks, Redux, TypeScript, and Next.js. Experienced in building full-stack applications with REST APIs and database integration."
        if not tailored.basics or not tailored.basics.label:
            tailored.basics.label = "React Developer"
        if not tailored.skills or len(tailored.skills) == 0:
            from app.services.resume_schema import Skill
            tailored.skills = [
                Skill(name="Frontend", keywords=["React", "TypeScript", "Next.js", "JavaScript", "Redux", "Tailwind CSS", "HTML/CSS"]),
                Skill(name="Backend", keywords=["Node.js", "Express", "REST APIs", "PostgreSQL"]),
                Skill(name="Tools", keywords=["Git", "Docker", "CI/CD", "VS Code"]),
            ]

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

        # --- Generate PDF ---
        log_resume_event(
            db, tailored_id, "pdf_generating", "Generating PDF"
        )
        try:
            pdf_bytes, pdf_path = generate_resume_pdf(tailored, str(tailored_id))
        except Exception as e:
            log_resume_event(
                db, tailored_id, "pdf_error", str(e), {"error_type": type(e).__name__}
            )
            pdf_path = ""

        # --- Persist to DB ---
        log_resume_event(
            db, tailored_id, "saving", "Saving tailored resume to database"
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
            pdf_path=pdf_path,
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


@router.delete("/resumes/tailored/{tailored_id}")
async def delete_tailored_resume(
    tailored_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
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

    db.delete(tailored)
    db.commit()

    return {"status": "deleted", "id": tailored_id}


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


@router.get("/resume/v3/{tailored_id}/download")
async def download_tailored_resume_v3(
    tailored_id: str,
    format: str = Query("pdf"),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Download V3 tailored resume.

    Serves PDF if already generated (pdf_path exists), otherwise
    renders HTML from stored JSON and converts to PDF on-the-fly.

    Query params:
      format=pdf  → returns PDF file
      format=html → returns HTML page (for browser preview)
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

    if tailored.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Resume not ready, status: {tailored.status}",
        )

    # If PDF already generated and exists, serve it
    if tailored.pdf_path and os.path.exists(tailored.pdf_path):
        return FileResponse(
            path=tailored.pdf_path,
            media_type="application/pdf",
            filename=f"tailored_resume_{tailored_id}.pdf",
        )

    # No PDF — render HTML from stored JSON
    if not tailored.llm_structured_json:
        raise HTTPException(
            status_code=404,
            detail="No resume data found for download",
        )

    try:
        resume = TailoredResumeSchema(**tailored.llm_structured_json)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse resume data: {e}",
        )

    html = render_resume(resume, tailored.template_used or "modern_tech")

    if format == "html":
        return HTMLResponse(content=html)

    # Convert HTML to PDF
    try:
        from weasyprint import HTML

        pdf_bytes = HTML(string=html).write_pdf()

        # Cache for future requests
        pdf_dir = os.path.join(os.path.dirname(UPLOAD_DIR), "pdfs")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_path = os.path.join(pdf_dir, f"tailored_{tailored_id}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        # Update DB with pdf_path
        tailored.pdf_path = pdf_path
        db.commit()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="tailored_resume_{tailored_id}.pdf"'
            },
        )
    except ImportError:
        # No WeasyPrint — return HTML instead
        return HTMLResponse(content=html)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {e}",
        )
