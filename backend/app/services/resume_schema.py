"""
JSON Resume Schema - Industry Standard Resume Structure
Based on jsonresume.org schema
https://jsonresume.org/schema/
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class Location(BaseModel):
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country_code: Optional[str] = None
    region: Optional[str] = None


class Profile(BaseModel):
    network: Optional[str] = None
    username: Optional[str] = None
    url: Optional[str] = None


class WorkExperience(BaseModel):
    name: str
    position: str
    url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    summary: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)
    location: Optional[str] = None


class VolunteerExperience(BaseModel):
    organization: str
    position: str
    url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    summary: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str
    url: Optional[str] = None
    area: str
    study_type: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    score: Optional[str] = None
    courses: List[str] = Field(default_factory=list)


class Certificate(BaseModel):
    name: str
    date: Optional[str] = None
    issuer: str
    url: Optional[str] = None


class Award(BaseModel):
    title: str
    date: Optional[str] = None
    awarder: str
    summary: Optional[str] = None


class Interest(BaseModel):
    name: str
    keywords: List[str] = Field(default_factory=list)


class Language(BaseModel):
    language: str
    fluency: Optional[str] = None


class Reference(BaseModel):
    name: str
    reference: str


class Project(BaseModel):
    name: str
    description: str
    highlights: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    url: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    entity: Optional[str] = None
    type: Optional[str] = None


class Skill(BaseModel):
    name: str
    level: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)


class ResumeBasics(BaseModel):
    name: str
    label: Optional[str] = None
    image: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    url: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[Location] = None
    profiles: List[Profile] = Field(default_factory=list)


class ResumeSchema(BaseModel):
    """Complete JSON Resume Schema"""

    schema: str = "https://jsonresume.org/schema/v1.0.0/"
    meta: Optional[Dict[str, Any]] = None

    basics: Optional[ResumeBasics] = None
    work: List[WorkExperience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    awards: List[Award] = Field(default_factory=list)
    certificates: List[Certificate] = Field(default_factory=list)
    publications: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    languages: List[Language] = Field(default_factory=list)
    interests: List[Interest] = Field(default_factory=list)
    references: List[Reference] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    volunteer: List[VolunteerExperience] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "basics": {
                    "name": "John Doe",
                    "label": "Software Engineer",
                    "email": "john@example.com",
                    "phone": "(555) 555-5555",
                    "summary": "Experienced software engineer with 5+ years...",
                },
                "work": [
                    {
                        "name": "Tech Corp",
                        "position": "Senior Developer",
                        "start_date": "2020-01",
                        "end_date": "2024-01",
                        "highlights": [
                            "Led team of 5 developers",
                            "Reduced API latency by 40%",
                        ],
                    }
                ],
                "skills": [
                    {
                        "name": "Programming Languages",
                        "keywords": ["Python", "JavaScript", "Go"],
                    }
                ],
            }
        }


class TailoredResumeSchema(ResumeSchema):
    """Extended schema with tailoring metadata"""

    original_text: Optional[str] = None
    job_description: Optional[str] = None

    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    added_keywords: List[str] = Field(default_factory=list)

    ats_score: int = 0
    ats_breakdown: Dict[str, int] = Field(default_factory=dict)

    optimization_notes: List[str] = Field(default_factory=list)

    template_used: str = "modern_tech"

    generated_at: datetime = Field(default_factory=datetime.utcnow)


class JobAnalysis(BaseModel):
    """Structured job description analysis"""

    raw_text: Optional[str] = None

    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    tools_and_technologies: List[str] = Field(default_factory=list)

    job_title: str = ""
    company_name: Optional[str] = ""
    location: str = ""
    salary_range: str = ""

    experience_years_min: Optional[int] = None
    education_level: Optional[str] = ""

    keywords: List[str] = Field(default_factory=list)

    ats_keywords: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)

    job_summary: str = ""
    responsibilities: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)

    is_weak_description: bool = False
    weak_description_notes: List[str] = Field(default_factory=list)


class MatchScoreResult(BaseModel):
    """Match score calculation result"""

    overall_score: int

    keyword_match_rate: float
    experience_match: int
    education_match: int

    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    bonus_keywords: List[str] = Field(default_factory=list)

    gap_analysis: Dict[str, Any] = Field(default_factory=dict)

    recommendations: List[str] = Field(default_factory=list)
