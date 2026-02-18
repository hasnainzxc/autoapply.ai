from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProfileBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    base_resume: Optional[str] = None
    base_cover_letter: Optional[str] = None


class ProfileCreate(ProfileBase):
    clerk_id: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    base_resume: Optional[str] = None
    base_cover_letter: Optional[str] = None


class ProfileResponse(ProfileBase):
    id: str
    clerk_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
