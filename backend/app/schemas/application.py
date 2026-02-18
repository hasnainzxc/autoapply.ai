from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class ApplicationStatus(str, Enum):
    QUEUED = "queued"
    SCRAPING = "scraping"
    ANALYZING = "analyzing"
    CRAFTING = "crafting"
    APPLYING = "applying"
    CONFIRMED = "confirmed"
    FAILED = "failed"


class JobBase(BaseModel):
    job_url: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None


class JobAnalyze(JobBase):
    user_id: str


class JobApply(JobBase):
    user_id: str


class ApplicationCreate(BaseModel):
    user_id: str
    job_url: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    match_score: Optional[int] = None
    tailored_resume: Optional[dict] = None
    cover_letter: Optional[str] = None
    applied_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    job_url: str
    job_title: Optional[str]
    company_name: Optional[str]
    company_logo: Optional[str]
    location: Optional[str]
    salary_range: Optional[str]
    status: str
    match_score: Optional[int]
    tailored_resume: Optional[dict]
    cover_letter: Optional[str]
    applied_at: Optional[datetime]
    error_message: Optional[str]
    retry_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TailoredResume(BaseModel):
    tailored_summary: str
    key_skills: List[str]
    work_experience: List[dict]
    education: List[dict]
    ats_score_estimate: int
