import os
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from app.services.database import get_db, Application, ApplicationEvent, Credit, CreditTransaction, ScanHistory, PipelineEntry
from app.services.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/applications")
async def list_applications(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    status: Optional[str] = None
):
    """List user's applications"""
    query = db.query(Application).filter(Application.user_id == current_user)
    
    if status:
        query = query.filter(Application.status == status)
    
    apps = query.order_by(Application.created_at.desc()).all()
    
    return [serialize_application(app) for app in apps]


def serialize_application(app: Application) -> dict:
    return {
        "id": str(app.id),
        "user_id": app.user_id,
        "job_url": app.job_url,
        "job_title": app.job_title,
        "company_name": app.company_name,
        "company_logo": app.company_logo,
        "location": app.location,
        "salary_range": app.salary_range,
        "status": app.status,
        "match_score": app.match_score,
        "score_rating": app.score_rating,
        "has_pdf": app.has_pdf,
        "report_path": app.report_path,
        "report_number": app.report_number,
        "portal": app.portal,
        "notes": app.notes,
        "cv_used": app.cv_used,
        "tailored_resume": app.tailored_resume,
        "cover_letter": app.cover_letter,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "error_message": app.error_message,
        "retry_count": app.retry_count,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None
    }


@router.get("/applications/stats")
async def get_application_stats(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get aggregated application statistics"""
    apps = db.query(Application).filter(Application.user_id == current_user).all()
    
    total = len(apps)
    by_status = {}
    for app in apps:
        s = app.status or "unknown"
        by_status[s] = by_status.get(s, 0) + 1
    
    scores = [a.match_score for a in apps if a.match_score is not None]
    avg_score = round(sum(scores) / len(scores)) if scores else 0
    
    applied_count = sum(1 for a in apps if a.status in ("applied", "confirmed"))
    responded_count = sum(1 for a in apps if a.status in ("responded", "interview", "offer"))
    interview_count = sum(1 for a in apps if a.status == "interview")
    offer_count = sum(1 for a in apps if a.status == "offer")
    
    return {
        "total": total,
        "by_status": by_status,
        "avg_match_score": avg_score,
        "response_rate": round((responded_count / applied_count * 100)) if applied_count else 0,
        "interview_rate": round((interview_count / applied_count * 100)) if applied_count else 0,
        "offer_rate": round((offer_count / applied_count * 100)) if applied_count else 0,
        "applied_count": applied_count,
        "responded_count": responded_count,
        "interview_count": interview_count,
        "offer_count": offer_count,
        "with_pdf_count": sum(1 for a in apps if a.has_pdf),
    }


@router.post("/applications/import")
async def import_application(
    body: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Import a single application from career-ops tracker data"""
    app = Application(
        user_id=current_user,
        job_url=body.get("job_url", ""),
        job_title=body.get("job_title", body.get("role", "")),
        company_name=body.get("company_name", body.get("company", "")),
        location=body.get("location", ""),
        salary_range=body.get("salary_range", ""),
        status=body.get("status", "applied").lower(),
        match_score=body.get("match_score"),
        score_rating=body.get("score_rating"),
        has_pdf=body.get("has_pdf", False),
        report_path=body.get("report_path"),
        report_number=body.get("report_number"),
        portal=body.get("portal"),
        notes=body.get("notes", ""),
        cv_used=body.get("cv_used"),
        applied_at=datetime.fromisoformat(body["applied_at"]) if body.get("applied_at") else None,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    event = ApplicationEvent(
        application_id=app.id,
        event_type="imported",
        message=f"Imported from career-ops tracker",
        payload={"source": "career-ops"}
    )
    db.add(event)
    db.commit()

    return serialize_application(app)


@router.get("/applications/{application_id}")
async def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get application details"""
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return serialize_application(app)


@router.patch("/applications/{application_id}")
async def update_application(
    application_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update application fields (status, notes, score, etc.)"""
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    allowed_fields = {"status", "notes", "match_score", "score_rating", "has_pdf", "portal", "cv_used", "location", "salary_range"}
    for key, value in body.items():
        if key in allowed_fields:
            setattr(app, key, value)
    
    if "status" in body and body["status"] != app.status:
        event = ApplicationEvent(
            application_id=app.id,
            event_type="status_changed",
            message=f"Status changed to {body['status']}",
            payload={"from": app.status, "to": body["status"]}
        )
        db.add(event)
    
    db.commit()
    db.refresh(app)
    return serialize_application(app)


@router.get("/applications/{application_id}/events")
async def get_application_events(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get event timeline for an application"""
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    events = db.query(ApplicationEvent).filter(
        ApplicationEvent.application_id == application_id
    ).order_by(ApplicationEvent.created_at.asc()).all()
    
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


@router.get("/applications/{application_id}/report")
async def get_application_report(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get evaluation report content for an application"""
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if not app.report_path:
        raise HTTPException(status_code=404, detail="No report available")
    
    report_path = app.report_path
    if not os.path.isabs(report_path):
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        report_path = os.path.join(base, report_path)
    
    try:
        with open(report_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content, "path": app.report_path}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Report file not found")


@router.delete("/applications/{application_id}")
async def cancel_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Cancel a queued application"""
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app.status not in ["queued", "scraping"]:
        raise HTTPException(status_code=400, detail="Cannot cancel application in current state")
    
    app.status = "failed"
    app.error_message = "Cancelled by user"
    db.commit()
    
    credit = db.query(Credit).filter(Credit.user_id == current_user).first()
    if credit:
        credit.balance = (credit.balance or 0) + 1
        credit.lifetime_used = max(0, (credit.lifetime_used or 1) - 1)
        db.commit()
        
        transaction = CreditTransaction(
            user_id=current_user,
            amount=1,
            type="refunded",
            description="Refunded for cancelled application"
        )
        db.add(transaction)
        db.commit()
    
    return {"status": "cancelled"}


@router.get("/scan-history")
async def list_scan_history(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    limit: int = 100
):
    """List scan history"""
    entries = db.query(ScanHistory).filter(
        ScanHistory.user_id == current_user
    ).order_by(ScanHistory.last_seen.desc()).limit(limit).all()

    return [
        {
            "id": str(e.id),
            "job_url": e.job_url,
            "title": e.title,
            "company": e.company,
            "location": e.location,
            "portal": e.portal,
            "status": e.status,
            "first_seen": e.first_seen.isoformat() if e.first_seen else None,
            "last_seen": e.last_seen.isoformat() if e.last_seen else None,
        }
        for e in entries
    ]


@router.get("/pipeline")
async def list_pipeline(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """List pipeline entries"""
    entries = db.query(PipelineEntry).filter(
        PipelineEntry.user_id == current_user
    ).order_by(PipelineEntry.created_at.desc()).all()

    return [
        {
            "id": str(e.id),
            "job_url": e.job_url,
            "title": e.title,
            "company": e.company,
            "section": e.section,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]


@router.post("/pipeline")
async def add_pipeline_entry(
    body: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Add a URL to the pipeline"""
    entry = PipelineEntry(
        user_id=current_user,
        job_url=body.get("job_url", ""),
        title=body.get("title", ""),
        company=body.get("company", ""),
        section=body.get("section", "pending"),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        "id": str(entry.id),
        "job_url": entry.job_url,
        "title": entry.title,
        "company": entry.company,
        "section": entry.section,
    }
