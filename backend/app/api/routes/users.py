from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from app.schemas.user import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.supabase import supabase_client

router = APIRouter()


def get_current_user(authorization: str = Header(None)) -> str:
    """Extract clerk_id from Clerk JWT"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # In production, verify Clerk JWT here
    # For now, return a placeholder
    return authorization.replace("Bearer ", "")


@router.get("/users/me")
async def get_current_user_profile(current_user: str = Depends(get_current_user)):
    """Get current user profile"""
    response = supabase_client.get_table("profiles").select("*").eq("clerk_id", current_user).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return response.data[0]


@router.put("/users/me")
async def update_current_user_profile(
    profile: ProfileUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update current user profile"""
    update_data = profile.model_dump(exclude_unset=True)
    update_data["updated_at"] = "now()"
    
    response = supabase_client.get_table("profiles").update(update_data).eq("clerk_id", current_user).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return response.data[0]


@router.post("/users/me/resume")
async def upload_resume(
    resume_text: str,
    current_user: str = Depends(get_current_user)
):
    """Upload base resume"""
    response = supabase_client.get_table("profiles").update({
        "base_resume": resume_text,
        "updated_at": "now()"
    }).eq("clerk_id", current_user).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"status": "uploaded"}


@router.post("/users/me/cover-letter")
async def upload_cover_letter(
    cover_letter: str,
    current_user: str = Depends(get_current_user)
):
    """Upload base cover letter template"""
    response = supabase_client.get_table("profiles").update({
        "base_cover_letter": cover_letter,
        "updated_at": "now()"
    }).eq("clerk_id", current_user).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"status": "uploaded"}
