from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import json
from pathlib import Path
from datetime import datetime

from app.services.database import get_db, Resume, TailoredResume, ResumeEvent
from app.services.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = Path("/home/hairzee/prods/applymate/backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def html_to_pdf(html_content: str) -> bytes:
    """Convert HTML to PDF using fpdf2"""
    try:
        from fpdf import FPDF
        from bs4 import BeautifulSoup
        import re
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        for tag in soup.find_all(['h1', 'h2', 'h3', 'p', 'li', 'div', 'span']):
            text = tag.get_text(strip=True)
            if not text:
                continue
            
            text = text.replace('\u2018', "'").replace('\u2019', "'")
            text = text.replace('\u201c', '"').replace('\u201d', '"')
            text = text.replace('\u2013', '-').replace('\u2014', '-')
            text = re.sub(r'[^\x00-\x7F]+', '', text)
            
            if tag.name == 'h1':
                pdf.set_font('Helvetica', 'B', 18)
                pdf.ln(8)
            elif tag.name == 'h2':
                pdf.set_font('Helvetica', 'B', 14)
                pdf.ln(6)
            elif tag.name == 'h3':
                pdf.set_font('Helvetica', 'B', 12)
                pdf.ln(5)
            else:
                pdf.set_font('Helvetica', '', 10)
            
            for line in text.split('\n'):
                if line.strip():
                    pdf.multi_cell(0, 5, line)
            pdf.ln(2)
        
        return pdf.output()
    except Exception as e:
        raise Exception(f"PDF generation failed: {str(e)}")


@router.get("/resumes")
async def list_resumes(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """List user's resumes and tailored versions"""
    resumes = db.query(Resume).filter(Resume.user_id == current_user).order_by(Resume.created_at.desc()).all()
    tailored = db.query(TailoredResume).filter(TailoredResume.user_id == current_user).order_by(TailoredResume.created_at.desc()).all()
    
    return {
        "resumes": [
            {
                "id": str(r.id),
                "name": r.name,
                "original_file_path": r.original_file_path,
                "extracted_text": r.extracted_text,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "last_used_at": r.last_used_at.isoformat() if r.last_used_at else None
            }
            for r in resumes
        ],
        "tailored": [
            {
                "id": str(t.id),
                "job_description": t.job_description[:50] + "..." if t.job_description and len(t.job_description or "") > 50 else t.job_description,
                "status": t.status,
                "pdf_path": t.pdf_path,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in tailored
        ]
    }


@router.get("/resume/{resume_id}/view")
async def view_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """View original resume PDF"""
    try:
        resume_uuid = uuid.UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume ID")
    
    resume = db.query(Resume).filter(
        Resume.id == resume_uuid,
        Resume.user_id == current_user
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if not resume.original_file_path or not os.path.exists(resume.original_file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    return FileResponse(
        resume.original_file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=\"{resume.name or 'resume'}\""}
    )


@router.delete("/resumes/{resume_id}")
async def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Delete a resume and its associated data"""
    try:
        resume_uuid = uuid.UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume ID")
    
    resume = db.query(Resume).filter(
        Resume.id == resume_uuid,
        Resume.user_id == current_user
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    try:
        if resume.original_file_path and os.path.exists(resume.original_file_path):
            os.remove(resume.original_file_path)
    except Exception:
        pass
    
    db.query(TailoredResume).filter(TailoredResume.resume_id == resume_uuid).delete()
    db.query(ResumeEvent).filter(ResumeEvent.tailored_resume_id.in_(
        db.query(TailoredResume.id).filter(TailoredResume.resume_id == resume_uuid)
    )).delete(synchronize_session=False)
    
    db.delete(resume)
    db.commit()
    
    return {"status": "deleted", "resume_id": resume_id}


@router.post("/resume/{resume_id}/use")
async def mark_resume_as_used(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Mark a resume as last used"""
    try:
        resume_uuid = uuid.UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume ID")
    
    resume = db.query(Resume).filter(
        Resume.id == resume_uuid,
        Resume.user_id == current_user
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume.last_used_at = datetime.utcnow()
    db.commit()
    
    return {
        "status": "updated",
        "resume_id": resume_id,
        "last_used_at": resume.last_used_at.isoformat()
    }


def log_resume_event(db: Session, tailored_resume_id: uuid.UUID, event_type: str, message: str, payload: dict = None):
    event = ResumeEvent(
        tailored_resume_id=tailored_resume_id,
        event_type=event_type,
        message=message,
        payload=payload
    )
    db.add(event)
    db.commit()


def extract_text_from_file(file_path: Path, filename: str) -> str:
    """Extract text from PDF or DOCX"""
    ext = filename.lower().split('.')[-1]
    
    if ext == 'pdf':
        try:
            import PyPDF2
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() or ""
                return text
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")
    
    elif ext == 'docx':
        try:
            import docx
            doc = docx.Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        except Exception as e:
            raise Exception(f"DOCX extraction failed: {str(e)}")
    
    else:
        raise Exception(f"Unsupported file type: {ext}")


@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload resume PDF or DOCX"""
    
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files supported")
    
    file_ext = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    if not name:
        base_name = file.filename.rsplit('.', 1)[0]
        today = datetime.now().strftime('%Y-%m-%d')
        name = f"{base_name}_{today}"
    
    resume = Resume(
        user_id=current_user,
        name=name,
        original_file_path=str(file_path)
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    log_resume_event(
        db, None, "upload_started",
        f"Resume upload started for user {current_user}",
        {"resume_id": str(resume.id), "filename": file.filename}
    )
    
    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        extracted_text = extract_text_from_file(file_path, file.filename)
        
        resume.extracted_text = extracted_text
        db.commit()
        
        log_resume_event(
            db, None, "extraction_completed",
            f"Text extraction completed",
            {"resume_id": str(resume.id), "text_length": len(extracted_text)}
        )
        
        log_resume_event(
            db, None, "upload_completed",
            f"Resume upload completed",
            {"resume_id": str(resume.id)}
        )
        
        return {
            "status": "completed",
            "resume_id": str(resume.id),
            "name": resume.name,
            "filename": file.filename,
            "text_length": len(extracted_text)
        }
        
    except Exception as e:
        log_resume_event(
            db, None, "upload_failed",
            f"Resume upload failed: {str(e)}",
            {"resume_id": str(resume.id), "error": str(e)}
        )
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/resume/tailor")
async def tailor_resume(
    resume_id: str = Form(...),
    job_description: str = Form(...),
    template: Optional[str] = Form("default"),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Tailor resume for a job description using LLM"""
    
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key or openrouter_key == "your_openrouter_key":
        raise HTTPException(
            status_code=503,
            detail="LLM service not configured. Please add OPENROUTER_API_KEY to environment."
        )
    
    try:
        resume_uuid = uuid.UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume_id")
    
    resume = db.query(Resume).filter(Resume.id == resume_uuid).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    tailored = TailoredResume(
        user_id=current_user,
        resume_id=resume_uuid,
        job_description=job_description,
        template_used=template,
        status="processing"
    )
    db.add(tailored)
    db.commit()
    db.refresh(tailored)
    
    log_resume_event(
        db, tailored.id, "tailoring_started",
        f"Resume tailoring started",
        {"resume_id": str(resume_id), "job_description_length": len(job_description)}
    )
    
    try:
        import httpx
        
        prompt = f"""You are an elite ATS (Applicant Tracking System) optimization expert and career strategist. Your task is to transform a generic resume into a HIGH-CONVERSION, ATS-optimized powerhouse that gets interviews.

## INPUT

**ORIGINAL RESUME:**
{resume.extracted_text}

**TARGET JOB DESCRIPTION:**
{job_description}

## CRITICAL ANALYSIS REQUIRED

Before generating output, you MUST analyze:

1. **Job Keywords Extraction**: Identify:
   - Required skills (hard skills, soft skills)
   - Preferred qualifications
   - Industry-specific terminology
   - Action verbs used in the job posting

2. **ATS Scoring Criteria** (rate each 0-100):
   - Keyword match rate
   - Format optimization (no tables, columns)
   - Quantified achievements
   - Industry relevance
   - Impact statements

3. **Gap Analysis**: What skills/experience is the candidate missing?

## OUTPUT FORMAT - Return ONLY valid JSON:

{{
    "ats_score_estimate": <number 0-100>,
    "ats_analysis": {{
        "keyword_match_rate": <percentage>,
        "format_score": <0-100>,
        "achievement_score": <0-100>,
        "impact_score": <0-100>
    }},
    "matched_keywords": [<list of keywords from resume that match job>],
    "missing_keywords": [<list of important job keywords missing in resume>],
    "summary": "<3-4 sentence IMPACT-FOCUSED summary. Start with years of experience + key value proposition. Include 2-3 relevant keywords naturally. NO generic filler>",
    "key_skills": [<list of 8-15 most relevant skills, prioritized by job relevance>],
    "work_experience": [
        {{
            "title": "<Job Title>",
            "company": "<Company Name>",
            "duration": "<Date Range>",
            "achievements": [
                "<REWRITTEN achievement using: Action verb + metric + context. Example: 'Increased revenue by 40% through implementing AI-driven customer segmentation, resulting in $2M additional annual income'>",
                "<Another quantified achievement>"
            ],
            "ats_optimization_tips": ["<specific tip for this role>"]
        }}
    ],
    "education": [<relevant education>],
    "optimization_suggestions": [
        "<specific actionable suggestion 1>",
        "<specific actionable suggestion 2>",
        "<specific actionable suggestion 3>"
    ],
    "cover_letter_points": [
        "<2-3 key points to mention in cover letter that aren't in resume>"
    ]
}}

## ACHIEVEMENT TRANSFORMATION RULES:

❌ BAD: "Managed team of developers"
✅ GOOD: "Led cross-functional team of 8 developers, delivering 12 enterprise applications that increased client retention by 35%"

❌ BAD: "Improved website performance"
✅ GOOD: "Optimized React application load time from 4.2s to 1.1s (74% improvement), boosting SEO rankings and reducing bounce rate by 28%"

❌ BAD: "Worked with customers"
✅ GOOD: "Interfaced with 50+ enterprise clients, handling escalations and maintaining 98% satisfaction rating"

## CRITICAL REQUIREMENTS:

1. QUANTIFY EVERY ACHIEVEMENT - Use numbers, percentages, $, time saved, people managed
2. Use POWER VERBS: Led, Built, Created, Implemented, Optimized, Increased, Reduced, Delivered, Architected, Designed
3. Include relevant keywords naturally (NOT stuffed)
4. Keep descriptions concise but impactful
5. Focus on business impact, not just duties

Return ONLY valid JSON. No markdown, no explanations.
"""
        
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
                        {"role": "system", "content": "You are an expert resume writer. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 2000
                },
                timeout=60.0
            )
        
        result = response.json()
        raw_response = result["choices"][0]["message"]["content"]
        
        tailored.llm_model = "qwen/qwen-2.5-7b-instruct"
        tailored.llm_raw_response = raw_response
        db.commit()
        
        log_resume_event(
            db, tailored.id, "llm_response_received",
            f"LLM response received",
            {"raw_response_length": len(raw_response)}
        )
        
        json_str = raw_response.strip()
        if json_str.startswith("```json"):
            json_str = json_str[7:]
        if json_str.startswith("```"):
            json_str = json_str[3:]
        if json_str.endswith("```"):
            json_str = json_str[:-3]
        json_str = json_str.strip()
        
        try:
            structured = json.loads(json_str)
        except json.JSONDecodeError:
            log_resume_event(
                db, tailored.id, "llm_parse_failed",
                f"First JSON parse failed, attempting retry",
                {"raw_response": raw_response[:500]}
            )
            
            import re
            json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                structured = json.loads(json_str)
            else:
                raise Exception("Could not parse JSON from LLM response")
        
        tailored.llm_structured_json = structured
        db.commit()
        
        log_resume_event(
            db, tailored.id, "llm_validated",
            f"LLM response validated",
            {"structured_keys": list(structured.keys())}
        )
        
        html_content = f"""
<!DOCTYPE html>
<html>
        
        pdf_filename = f"{tailored.id}.pdf"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; color: #333; }}
        h1 {{ color: #1a1a1a; margin-bottom: 5px; }}
        .contact {{ color: #666; font-size: 12px; margin-bottom: 20px; }}
        h2 {{ color: #2d3748; border-bottom: 2px solid #FACC15; padding-bottom: 5px; margin-top: 25px; }}
        .section {{ margin-bottom: 15px; }}
        .skills {{ display: flex; flex-wrap: wrap; gap: 6px; }}
        .skill {{ background: #f7f7f7; padding: 4px 10px; border-radius: 3px; font-size: 12px; border: 1px solid #e0e0e0; }}
        .experience {{ margin-bottom: 18px; }}
        .job-title {{ font-weight: bold; color: #1a1a1a; }}
        .company {{ color: #666; }}
        .duration {{ color: #888; font-size: 12px; }}
        .achievements {{ margin-left: 20px; }}
        .achievements li {{ margin-bottom: 5px; color: #4a5568; }}
        .ats-score {{ background: #FACC15; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-weight: bold; }}
    </style>
</head>
<body>
    <h1>{current_user}</h1>
    <div class="contact">ATS-Optimized Resume | Score: {structured.get('ats_score_estimate', 0)}/100</div>
    
    <div class="ats-score">
        Match Score: {structured.get('ats_score_estimate', 0)}% | Keywords Matched: {len(structured.get('matched_keywords', []))} | Missing: {len(structured.get('missing_keywords', []))}
    </div>

    <div class="section">
        <h2>Professional Summary</h2>
        <p>{structured.get('summary', '')}</p>
    </div>

    <div class="section">
        <h2>Key Skills (ATS-Optimized)</h2>
        <div class="skills">
            {''.join([f'<span class="skill">{s}</span>' for s in structured.get('key_skills', [])])}
        </div>
    </div>

    <div class="section">
        <h2>Professional Experience</h2>
        {''.join([f'''
        <div class="experience">
            <span class="job-title">{exp.get('title', '')}</span>
            <span class="company"> at {exp.get('company', '')}</span>
            <br>
            <span class="duration">{exp.get('duration', '')}</span>
            <ul class="achievements">{''.join([f'<li>{a}</li>' for a in exp.get('achievements', [])])}</ul>
        </div>
        ''' for exp in structured.get('work_experience', [])])}
    </div>

    <div class="section">
        <h2>Education</h2>
        {''.join([f'''
        <div>
            <strong>{edu.get('degree', '')}</strong> - {edu.get('institution', '')} ({edu.get('year', '')})
        </div>
        ''' for edu in structured.get('education', [])])}
    </div>

    <div class="section">
        <h2>Optimization Insights</h2>
        <p><strong>Missing Keywords to add:</strong> {', '.join(structured.get('missing_keywords', []))}</p>
        <p><strong>Tips:</strong></p>
        <ul>{''.join([f'<li>{s}</li>' for s in structured.get('optimization_suggestions', [])])}</ul>
    </div>
</body>
</html>
"""
        
        pdf_bytes = html_to_pdf(html_content)
        
        pdf_filename = f"{tailored.id}.pdf"
        pdf_path = UPLOAD_DIR / pdf_filename
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        
        tailored.pdf_path = str(pdf_path)
        tailored.status = "completed"
        db.commit()
        
        log_resume_event(
            db, tailored.id, "tailoring_completed",
            f"Resume tailoring completed",
            {"pdf_path": str(pdf_path)}
        )
        
        return {
            "status": "completed",
            "tailored_resume_id": str(tailored.id),
            "pdf_path": str(pdf_path),
            "ats_score_estimate": structured.get("ats_score_estimate", 0),
            "structured_data": structured
        }
        
    except Exception as e:
        tailored.status = "failed"
        db.commit()
        
        log_resume_event(
            db, tailored.id, "tailoring_failed",
            f"Resume tailoring failed: {str(e)}",
            {"error": str(e)}
        )
        
        raise HTTPException(status_code=500, detail=f"Tailoring failed: {str(e)}")


@router.get("/resume/{tailored_resume_id}/download")
async def download_tailored_resume(
    tailored_resume_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Download generated PDF"""
    
    try:
        resume_uuid = uuid.UUID(tailored_resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    tailored = db.query(TailoredResume).filter(
        TailoredResume.id == resume_uuid,
        TailoredResume.user_id == current_user
    ).first()
    
    if not tailored:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if tailored.status != "completed":
        raise HTTPException(status_code=400, detail=f"Resume not ready, status: {tailored.status}")
    
    if not tailored.pdf_path or not os.path.exists(tailored.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    return FileResponse(
        tailored.pdf_path,
        media_type="application/pdf",
        filename=f"resume_{tailored_resume_id}.pdf"
    )


@router.get("/resume/events/{tailored_resume_id}")
async def get_resume_events(
    tailored_resume_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get events for a tailored resume"""
    
    try:
        resume_uuid = uuid.UUID(tailored_resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    events = db.query(ResumeEvent).filter(
        ResumeEvent.tailored_resume_id == resume_uuid
    ).order_by(ResumeEvent.created_at).all()
    
    return [
        {
            "id": str(e.id),
            "event_type": e.event_type,
            "message": e.message,
            "payload": e.payload,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in events
    ]


@router.post("/resume/cover-letter")
async def generate_cover_letter(
    resume_id: str = Form(...),
    job_description: str = Form(...),
    company_name: str = Form(""),
    hiring_manager: str = Form(""),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generate a cover letter based on resume and job description"""
    
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise HTTPException(
            status_code=503,
            detail="LLM service not configured. Please add OPENROUTER_API_KEY to environment."
        )
    
    try:
        resume_uuid = uuid.UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume_id")
    
    resume = db.query(Resume).filter(Resume.id == resume_uuid).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    try:
        import httpx
        
        prompt = f"""You are an expert cover letter writer. Write a compelling, professional cover letter.

Resume:
{resume.extracted_text}

Job Description:
{job_description}

{"Hiring Manager: " + hiring_manager if hiring_manager else ""}
{"Company: " + company_name if company_name else ""}

Write a cover letter that:
1. Addresses the hiring manager professionally (use "Dear Hiring Manager" if name unknown)
2. Highlights relevant experience and skills from the resume
3. Shows enthusiasm for the role and company
4. Is concise (3-4 paragraphs max)
5. Uses professional language
6. Includes a call to action

Return ONLY the cover letter text, no formatting or markdown.
"""
        
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
                        {"role": "system", "content": "You are an expert cover letter writer. Write professional, compelling cover letters."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1500
                },
                timeout=60.0
            )
        
        result = response.json()
        cover_letter = result["choices"][0]["message"]["content"]
        
        formatted_cover_letter = cover_letter.replace('\n\n', '</div><div class="body">')
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
        .date {{ margin-bottom: 20px; color: #666; }}
        .salutation {{ margin-bottom: 20px; }}
        .body {{ margin-bottom: 20px; }}
        .closing {{ margin-top: 30px; }}
        .signature {{ margin-top: 40px; }}
    </style>
</head>
<body>
    <div class="date">{company_name or "Dear Hiring Manager"}</div>
    <div class="salutation">Dear {hiring_manager or "Hiring Manager"},</div>
    <div class="body">
        {formatted_cover_letter}
    </div>
    <div class="closing">Sincerely,</div>
    <div class="signature">{current_user}</div>
</body>
</html>
"""
        
        pdf_bytes = html_to_pdf(html_content)
        
        pdf_filename = f"cover_letter_{uuid.uuid4()}.pdf"
        pdf_path = UPLOAD_DIR / pdf_filename
        
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        
        return {
            "status": "completed",
            "cover_letter_text": cover_letter,
            "pdf_path": f"/api/resume/cover-letter/{pdf_filename}/download"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")


@router.get("/resume/cover-letter/{filename}/download")
async def download_cover_letter(
    filename: str,
    current_user: str = Depends(get_current_user)
):
    """Download generated cover letter PDF"""
    
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file")
    
    pdf_path = UPLOAD_DIR / filename
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"cover_letter_{filename}"
    )