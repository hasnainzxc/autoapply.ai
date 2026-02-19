from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.services.database import get_db, Profile, get_or_create_credits
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/users/me")
async def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get current user profile"""
    profile = db.query(Profile).filter(Profile.clerk_id == current_user).first()
    
    if not profile:
        profile = Profile(
            clerk_id=current_user,
            email=f"{current_user}@example.com",
            full_name="Test User"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return {
        "id": str(profile.id),
        "clerk_id": profile.clerk_id,
        "email": profile.email,
        "full_name": profile.full_name,
        "base_resume": profile.base_resume
    }


@router.put("/users/me")
async def update_current_user_profile(
    profile_data: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update current user profile"""
    profile = db.query(Profile).filter(Profile.clerk_id == current_user).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if "full_name" in profile_data:
        profile.full_name = profile_data["full_name"]
    if "email" in profile_data:
        profile.email = profile_data["email"]
    if "base_resume" in profile_data:
        profile.base_resume = profile_data["base_resume"]
    
    db.commit()
    db.refresh(profile)
    
    return {"status": "updated", "profile_id": str(profile.id)}


@router.post("/users/me/resume")
async def upload_resume(
    resume_data: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload base resume"""
    profile = db.query(Profile).filter(Profile.clerk_id == current_user).first()
    
    if not profile:
        profile = Profile(clerk_id=current_user)
        db.add(profile)
    
    profile.base_resume = resume_data.get("resume_text", "")
    db.commit()
    
    return {"status": "uploaded"}


@router.post("/users/me/cover-letter")
async def upload_cover_letter(
    cover_letter_data: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload base cover letter template"""
    profile = db.query(Profile).filter(Profile.clerk_id == current_user).first()
    
    if not profile:
        profile = Profile(clerk_id=current_user)
        db.add(profile)
    
    profile.base_resume = cover_letter_data.get("cover_letter", "")
    db.commit()
    
    return {"status": "uploaded"}
