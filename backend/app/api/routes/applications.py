from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from app.services.database import get_db, Application, Credit, CreditTransaction
from app.services.auth import get_current_user
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
    
    return [
        {
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
            "tailored_resume": app.tailored_resume,
            "cover_letter": app.cover_letter,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "error_message": app.error_message,
            "retry_count": app.retry_count,
            "created_at": app.created_at.isoformat() if app.created_at else None,
            "updated_at": app.updated_at.isoformat() if app.updated_at else None
        }
        for app in apps
    ]


@router.get("/applications/{application_id}")
async def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get application details"""
    try:
        app_uuid = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    app = db.query(Application).filter(
        Application.id == app_uuid,
        Application.user_id == current_user
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
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
        "tailored_resume": app.tailored_resume,
        "cover_letter": app.cover_letter,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "error_message": app.error_message,
        "retry_count": app.retry_count,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None
    }


@router.delete("/applications/{application_id}")
async def cancel_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Cancel a queued application"""
    try:
        app_uuid = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    app = db.query(Application).filter(
        Application.id == app_uuid,
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
