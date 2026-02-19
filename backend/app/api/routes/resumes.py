from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import json
from pathlib import Path

from app.services.database import get_db, Resume, TailoredResume, ResumeEvent
from app.services.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = Path("/home/hairzee/prods/applymate/backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload resume PDF or DOCX"""
    
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files supported")
    
    file_ext = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    resume = Resume(
        user_id=current_user,
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
        
        prompt = f"""You are an expert resume writer. Tailor the following resume to match the job description.

Resume:
{resume.extracted_text}

Job Description:
{job_description}

Return ONLY valid JSON with this exact structure:
{{
    "summary": "2-3 sentence professional summary",
    "key_skills": ["skill1", "skill2", "skill3"],
    "work_experience": [
        {{
            "title": "Job Title",
            "company": "Company Name", 
            "duration": "Jan 2020 - Present",
            "achievements": ["Achievement 1", "Achievement 2"]
        }}
    ],
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "University Name",
            "year": "2020"
        }}
    ],
    "ats_score_estimate": 85
}}
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
        
        from weasyprint import HTML
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #666; border-bottom: 1px solid #ccc; }}
        .section {{ margin-bottom: 20px; }}
        .skills {{ display: flex; flex-wrap: wrap; gap: 8px; }}
        .skill {{ background: #e0e0e0; padding: 4px 12px; border-radius: 4px; }}
        .experience {{ margin-bottom: 15px; }}
    </style>
</head>
<body>
    <h1>{current_user}</h1>
    <div class="section">
        <h2>Summary</h2>
        <p>{structured.get('summary', '')}</p>
    </div>
    <div class="section">
        <h2>Key Skills</h2>
        <div class="skills">
            {''.join([f'<span class="skill">{s}</span>' for s in structured.get('key_skills', [])])}
        </div>
    </div>
    <div class="section">
        <h2>Work Experience</h2>
        {''.join([f'''
        <div class="experience">
            <strong>{exp.get('title', '')}</strong> at {exp.get('company', '')}<br>
            <em>{exp.get('duration', '')}</em><br>
            <ul>{''.join([f'<li>{a}</li>' for a in exp.get('achievements', [])])}</ul>
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
</body>
</html>
"""
        
        pdf_bytes = HTML(string=html_content).write_pdf()
        
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