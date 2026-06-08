"""
LLM Orchestrator - Token-efficient multi-step resume tailoring
Uses strategic model selection to minimize costs while maximizing quality

Step 1: Structure (cheap) - Parse resume into JSON
Step 2: Analyze (cheap) - Extract job keywords
Step 3: Rewrite (premium) - Smart enhancement with best model
"""

import json
import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

import httpx

from app.services.resume_schema import (
    ResumeSchema,
    TailoredResumeSchema,
    JobAnalysis,
    MatchScoreResult,
)


class ModelTier(Enum):
    """LLM model tiers for cost optimization"""

    CHEAP = "cheap"  # For simple extraction/analysis
    STANDARD = "standard"  # For standard operations
    PREMIUM = "premium"  # For complex rewriting


@dataclass
class ModelConfig:
    """Configuration for LLM model selection"""

    tier: ModelTier
    model_id: str
    max_tokens: int
    temperature: float = 0.3


LLM_MODELS = {
    ModelTier.CHEAP: ModelConfig(
        tier=ModelTier.CHEAP,
        model_id=os.getenv("LLM_CHEAP_MODEL", "openrouter/free"),
        max_tokens=1024,
        temperature=0.3,
    ),
    ModelTier.STANDARD: ModelConfig(
        tier=ModelTier.STANDARD,
        model_id=os.getenv("LLM_STANDARD_MODEL", "openrouter/free"),
        max_tokens=1024,
        temperature=0.4,
    ),
    ModelTier.PREMIUM: ModelConfig(
        tier=ModelTier.PREMIUM,
        model_id=os.getenv("LLM_PREMIUM_MODEL", "openrouter/free"),
        max_tokens=1024,
        temperature=0.5,
    ),
}


class LLMOrchestrator:
    """
    Token-efficient LLM orchestrator for resume tailoring.
    Uses multi-step approach with strategic model selection.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is required")

    @staticmethod
    def normalize_unicode(text: str) -> str:
        """Normalize unicode for ATS compatibility."""
        import unicodedata

        text = unicodedata.normalize("NFKC", text)
        replacements = {
            "\u201c": '"',
            "\u201d": '"',
            "\u2018": "'",
            "\u2019": "'",
            "\u2013": "-",
            "\u2014": "--",
            "\u2026": "...",
            "\u00a0": " ",
            "\u2022": "-",
            "\u202f": " ",
            "\u2000\u2009": " ",
            "\u200a": " ",
            "\u200b": "",
            "\ufeff": "",
            "\u00b7": "*",
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text

    @staticmethod
    def construct_profile_text(profile: dict) -> str:
        """Construct a pseudo-resume text from profile data for the pipeline.

        Profile dict format:
        {
            "full_name": str,
            "email": str,
            "phone": str,
            "experience_years": int,
            "current_role": str (optional),
            "location": str (optional),
            "skills": list[str] (optional),
            "summary": str (optional)
        }

        Returns plain text parseable by step1_extract_structure as valid resume input.
        """
        parts = []
        parts.append(f"Name: {profile.get('full_name', '')}")
        if profile.get("email"):
            parts.append(f"Email: {profile['email']}")
        if profile.get("phone"):
            parts.append(f"Phone: {profile['phone']}")
        if profile.get("location"):
            parts.append(f"Location: {profile['location']}")
        if profile.get("current_role"):
            parts.append(f"Current Role: {profile['current_role']}")
        if profile.get("experience_years"):
            parts.append(f"Years of Experience: {profile['experience_years']}")
        if profile.get("summary"):
            parts.append(f"\nSummary:\n{profile['summary']}")
        if profile.get("skills"):
            parts.append(f"\nSkills:\n{', '.join(profile['skills'])}")

        return "\n".join(parts)

    async def _call_llm(
        self,
        messages: List[Dict[str, str]],
        model_config: ModelConfig,
        retry_count: int = 5,
    ) -> str:
        """Make API call to LLM (OpenRouter or Gemini) with retry logic"""
        # Development mock mode — returns plausible JSON without API call
        if os.getenv("LLM_MOCK_MODE") == "true":
            return self._mock_response(messages)
        
        gemini_key = os.getenv("GEMINI_API_KEY")
        
        if gemini_key and (model_config.model_id.startswith("gemini") or model_config.model_id.startswith("google/")):
            return await self._call_gemini(messages, model_config, gemini_key, retry_count)
        return await self._call_openrouter(messages, model_config, retry_count)

    def _mock_response(self, messages: List[Dict[str, str]]) -> str:
        """Generate mock JSON responses for development/testing"""
        sys_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_msg = next((m["content"] for m in messages if m["role"] == "user"), "")
        combined = (sys_msg + " " + user_msg).lower()
        
        if "extract" in combined and "structure" in combined:
            return json.dumps({
                "basics": {"name": "Jane Dev", "email": "jane@test.com", "phone": "+1234567890",
                           "summary": "Experienced developer", "location": {"city": "Dubai"}},
                "skills": [{"name": "Python", "keywords": ["Flask", "FastAPI"]}],
                "work": [{"name": "Tech Co", "position": "Developer", "start_date": "2022-01",
                          "highlights": ["Built web apps with Flask"]}],
                "projects": [{"name": "Web App", "description": "Built with Flask and React"}],
                "education": [{"institution": "University", "area": "CS", "study_type": "BS"}]
            })
        
        if "analyze" in combined and "job" in combined:
            return json.dumps({
                "job_title": "Software Developer", "company_name": "Tech Corp",
                "required_skills": ["Python", "Flask"], "preferred_skills": [],
                "tools_and_technologies": ["Flask"], "experience_years_min": 2,
                "education_level": "Bachelor's", "keywords": ["Python", "Flask"],
                "ats_keywords": ["Python", "Flask"], "soft_skills": ["Teamwork"],
                "responsibilities": ["Develop Flask apps"], "qualifications": ["Python exp"],
                "is_weak_description": False, "weak_description_notes": []
            })
        
        if "match score" in combined or "calculate" in combined and "match" in combined:
            return json.dumps({
                "overall_score": 78, "keyword_match_rate": 0.72, "experience_match": 75,
                "education_match": 80, "matched_keywords": ["Python", "Flask"],
                "missing_keywords": ["Docker"], "bonus_keywords": [],
                "gap_analysis": {"skills_gap": "Missing Docker"},
                "recommendations": ["Add Docker experience if applicable"]
            })
        
        # Default: step4 tailor response
        return json.dumps({
            "basics": {"name": "Jane Dev", "email": "jane@test.com", "phone": "+1234567890",
                       "summary": "Junior Python developer with Flask experience seeking new role.",
                       "label": "Junior Developer", "location": {"city": "Dubai"}},
            "skills": [{"name": "Programming", "keywords": ["Python", "Flask", "REST APIs"]}],
            "work": [{"name": "Tech Startup", "position": "Junior Developer", "start_date": "2022-01",
                      "highlights": ["Built REST APIs with Flask", "Worked in agile team of 5 developers"]}],
            "projects": [{"name": "Task Manager API", "description": "RESTful Flask API with SQLAlchemy",
                          "highlights": ["Designed RESTful endpoints", "Integrated PostgreSQL"]}],
            "education": [{"institution": "Tech University", "area": "Computer Science", "study_type": "BSc"}]
        })

    async def _call_gemini(
        self,
        messages: List[Dict[str, str]],
        model_config: ModelConfig,
        api_key: str,
        retry_count: int = 3,
    ) -> str:
        """Call Google Gemini API directly"""
        import httpx
        
        # Convert chat messages to Gemini format
        system_instruction = None
        contents = []
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = {"parts": [{"text": msg["content"]}]}
            else:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": model_config.temperature,
                "maxOutputTokens": model_config.max_tokens,
            },
        }
        if system_instruction:
            body["systemInstruction"] = system_instruction
        
        # Map model ID to Gemini model name
        model_id = model_config.model_id
        if model_id == "openrouter/free" or model_id == "qwen/qwen3-coder:free":
            model_id = "gemini-2.0-flash"
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"
        
        for attempt in range(retry_count):
            try:
                async with httpx.AsyncClient(timeout=180.0) as client:
                    response = await client.post(url, json=body)
                    
                    if response.status_code == 200:
                        result = response.json()
                        return result["candidates"][0]["content"]["parts"][0]["text"]
                    
                    elif response.status_code == 429:
                        await self._wait_with_exponential_backoff(attempt)
                        continue
                    
                    else:
                        raise Exception(
                            f"Gemini API error: {response.status_code} - {response.text}"
                        )
            
            except Exception as e:
                if attempt == retry_count - 1:
                    raise Exception(f"Failed after {retry_count} attempts: {str(e)}")
                await self._wait_with_exponential_backoff(attempt)
        
        raise Exception("Max retries exceeded")

    async def _call_openrouter(
        self,
        messages: List[Dict[str, str]],
        model_config: ModelConfig,
        retry_count: int = 3,
    ) -> str:
        """Make API call to OpenRouter with retry logic"""
        import httpx

        for attempt in range(retry_count):
            try:
                async with httpx.AsyncClient(timeout=180.0) as client:
                    response = await client.post(
                        self.base_url,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://applymate.ai",
                            "X-Title": "ApplyMate Resume Tailoring",
                        },
                        json={
                            "model": model_config.model_id,
                            "messages": messages,
                            "max_tokens": model_config.max_tokens,
                            "temperature": model_config.temperature,
                        },
                    )

                    if response.status_code == 200:
                        result = response.json()
                        return result["choices"][0]["message"]["content"]

                    elif response.status_code == 429:
                        await self._wait_with_exponential_backoff(attempt)
                        continue

                    else:
                        raise Exception(
                            f"LLM API error: {response.status_code} - {response.text}"
                        )

            except Exception as e:
                if attempt == retry_count - 1:
                    raise Exception(f"Failed after {retry_count} attempts: {str(e)}")
                await self._wait_with_exponential_backoff(attempt)

        raise Exception("Max retries exceeded")

    async def _wait_with_exponential_backoff(self, attempt: int):
        """Exponential backoff for rate limiting"""
        import asyncio

        wait_time = (2**attempt) + 1
        await asyncio.sleep(wait_time)

    async def step1_extract_structure(self, raw_resume_text: str) -> ResumeSchema:
        """
        Step 1: Extract structured data from raw resume text.
        Uses cheap model for simple extraction task.
        """
        system_prompt = """You are an expert at parsing resumes. Extract structured information from the raw resume text and return ONLY valid JSON.

Return this exact JSON structure:
{
    "basics": {
        "name": "Full Name",
        "label": "Job Title/Role",
        "email": "email@example.com",
        "phone": "phone number",
        "summary": "Professional summary (2-3 sentences)"
    },
    "work": [
        {
            "name": "Company Name",
            "position": "Job Title",
            "start_date": "YYYY-MM or null",
            "end_date": "YYYY-MM or null",
            "summary": "Brief role description",
            "highlights": ["Achievement 1", "Achievement 2"]
        }
    ],
    "education": [
        {
            "institution": "University Name",
            "area": "Field of Study",
            "study_type": "Degree Type",
            "start_date": "YYYY or null",
            "end_date": "YYYY or null"
        }
    ],
    "skills": [
        {
            "name": "Category (e.g., Programming Languages)",
            "keywords": ["Skill1", "Skill2", "Skill3"]
        }
    ],
    "certificates": [
        {
            "name": "Certificate Name",
            "issuer": "Issuing Organization",
            "date": "YYYY or null"
        }
    ],
    "projects": [
        {
            "name": "Project Name",
            "description": "Brief description",
            "highlights": ["Key feature 1", "Key feature 2"]
        }
    ]
}

CRITICAL RULES:
1. Preserve ALL original skills, technologies, and keywords exactly as written
2. NEVER invent or hallucinate information not in the resume
3. For dates, use YYYY-MM format if month known, otherwise YYYY
4. Keep the candidate's exact wording for achievements when possible
5. Return ONLY the JSON, no markdown code blocks, no explanations
"""

        user_message = (
            f"Extract structured data from this resume:\n\n{raw_resume_text[:8000]}"
        )

        response = await self._call_llm(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            model_config=LLM_MODELS[ModelTier.CHEAP],
        )

        json_str = self._extract_json(response)
        data = json.loads(json_str)

        return ResumeSchema(**data)

    async def step2_analyze_job(self, job_description: str) -> JobAnalysis:
        """
        Step 2: Analyze job description to extract keywords and requirements.
        Uses cheap model for keyword extraction.
        """
        system_prompt = """You are an expert job analyst. Analyze the job description and extract structured information.

Return ONLY valid JSON with this exact structure:
{
    "job_title": "Exact job title",
    "company_name": "Company name if mentioned",
    "required_skills": ["Skill1", "Skill2"],
    "preferred_skills": ["Nice-to-have skill1"],
    "tools_and_technologies": ["Tool1", "Tool2"],
    "experience_years_min": number or null,
    "education_level": "Required education level",
    "keywords": ["All important keywords from job"],
    "ats_keywords": ["Critical ATS keywords to include"],
    "soft_skills": ["Communication", "Leadership"],
    "responsibilities": ["Key responsibility 1"],
    "qualifications": ["Key qualification 1"],
    "is_weak_description": true/false,
    "weak_description_notes": ["Note if description is vague or missing details"]
}

CRITICAL RULES:
1. Extract ALL technical skills, tools, technologies EXACTLY as written
2. Identify ATS-critical keywords (usually mentioned multiple times or in requirements)
3. Determine if job description is weak (vague, missing details) vs strong (specific requirements)
4. Return ONLY the JSON, no markdown, no explanations
"""

        user_message = f"Analyze this job description:\n\n{job_description[:6000]}"

        response = await self._call_llm(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            model_config=LLM_MODELS[ModelTier.CHEAP],
        )

        json_str = self._extract_json(response)
        data = json.loads(json_str)
        data["raw_text"] = job_description

        return JobAnalysis(**data)

    async def step3_calculate_match(
        self, resume: ResumeSchema, job: JobAnalysis
    ) -> MatchScoreResult:
        """
        Step 3: Calculate match score between resume and job.
        Uses standard model for analysis.
        """
        resume_text = self._resume_to_text(resume)
        job_text = json.dumps(job.model_dump(), indent=2)

        system_prompt = """You are an ATS (Applicant Tracking System) expert and career analyst. Calculate a detailed match score between a resume and job description.

Return ONLY valid JSON:
{
    "overall_score": 0-100,
    "keyword_match_rate": 0.0-1.0,
    "experience_match": 0-100,
    "education_match": 0-100,
    "matched_keywords": ["skill1", "skill2"],
    "missing_keywords": ["critical missing skill1"],
    "bonus_keywords": ["resume has extra valuable skill1"],
    "gap_analysis": {
        "skills_gap": "What skills resume is missing",
        "experience_gap": "Experience level gap if any"
    },
    "recommendations": ["Specific recommendation 1"]
}

CRITICAL RULES:
1. Score 80-100: Strong match, candidate should apply
2. Score 60-79: Good match with minor gaps, application worthwhile
3. Score 40-59: Moderate match, significant gaps exist
4. Score below 40: Poor match, likely wasting time
5. Return ONLY JSON, no markdown, no explanations
"""

        user_message = f"""RESUME:
{resume_text}

JOB ANALYSIS:
{job_text}
"""

        response = await self._call_llm(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            model_config=LLM_MODELS[ModelTier.STANDARD],
        )

        json_str = self._extract_json(response)
        data = json.loads(json_str)

        return MatchScoreResult(**data)

    def _estimate_experience_years(self, resume: ResumeSchema) -> float:
        """Estimate total years of experience from work history dates."""
        if not resume.work:
            return 0.0
        start_dates = []
        end_dates = []
        now = __import__("datetime").datetime.now()
        current_year = now.year + now.month / 12.0
        for job in resume.work:
            if job.start_date:
                try:
                    parts = job.start_date.split("-")
                    if len(parts) >= 1:
                        year = int(parts[0])
                        month = int(parts[1]) if len(parts) >= 2 else 1
                        start_dates.append(year + month / 12.0)
                except (ValueError, TypeError):
                    pass
            if job.end_date:
                try:
                    parts = job.end_date.split("-")
                    if len(parts) >= 1:
                        year = int(parts[0])
                        month = int(parts[1]) if len(parts) >= 2 else 6
                        end_dates.append(year + month / 12.0)
                except (ValueError, TypeError):
                    pass
        if not start_dates:
            return 0.0
        earliest = min(start_dates)
        latest = max(end_dates) if end_dates else current_year
        return max(0.0, round(latest - earliest, 1))

    async def step4_tailor_resume(
        self,
        resume: ResumeSchema,
        job: JobAnalysis,
        match_result: MatchScoreResult,
        experience_years_strategy: str = "default",
    ) -> TailoredResumeSchema:
        """
        Step 4: Tailor resume for the specific job.
        Uses PREMIUM model - this is the most important step.
        """
        resume_text = self._resume_to_text(resume)
        job_text = self._job_to_text(job)

        experience_note = ""
        if experience_years_strategy == "dynamic" and job.experience_years_min:
            candidate_years = self._estimate_experience_years(resume)
            if candidate_years < job.experience_years_min:
                experience_note = f"""
EXPERIENCE GAP STRATEGY:
The JD requires approximately {job.experience_years_min} years of experience. 
Candidate has approximately {candidate_years} years. 
Frame existing experience to demonstrate equivalent capability. 
Focus on depth of achievements and impact rather than total years. 
Do NOT misrepresent years of experience.
"""
        system_prompt = """You are an expert resume writer who crafts ATS-optimized resumes that also impress human recruiters.

YOUR CORE PRINCIPLES:
1. PRESERVE ALL ORIGINAL CONTENT - Never remove skills, technologies, or experience
2. ENHANCE EXISTING - Improve achievements without changing their meaning
3. QUANTIFY WHEN POSSIBLE - Add numbers/percentages to vague achievements
4. NATURAL KEYWORD INTEGRATION - Weave job keywords into existing content
5. AUTHENTIC VOICE - Keep candidate's writing style, avoid AI-slop language

CRITICAL REQUIREMENTS:
- NEVER invent skills the candidate doesn't have
- NEVER change company names or job titles
- NEVER fabricate achievements or dates
- If something isn't in the resume, don't add it
- Focus on improving HOW achievements are described, not WHAT they are

Return ONLY valid JSON:
{
    "basics": {
        "name": "Full Name",
        "label": "Tailored Job Title (match job)",
        "email": "email",
        "phone": "phone",
        "summary": "Enhanced 2-3 sentence summary with job-relevant keywords naturally included"
    },
    "work": [
        {
            "name": "Company Name",
            "position": "Job Title",
            "start_date": "YYYY-MM or null",
            "end_date": "YYYY-MM or null",
            "summary": "Enhanced brief description",
            "highlights": [
                "Enhanced achievement 1 - quantified where possible",
                "Enhanced achievement 2 - with metrics if available",
                "Original achievement 3 - kept as-is if already strong"
            ]
        }
    ],
    "education": [...],
    "skills": [...],
    "matched_keywords": ["skills that matched"],
    "missing_keywords": ["important job skills not in resume - DO NOT ADD, just note"],
    "added_keywords": [],
    "ats_score": 0-100,
    "ats_breakdown": {
        "keyword_match": 0-100,
        "format_score": 0-100,
        "achievement_score": 0-100,
        "impact_score": 0-100
    },
    "optimization_notes": ["Note any specific optimizations made"],
    "template_used": "modern_tech"
}

KEYWORD INTEGRATION EXAMPLES:
Job wants: "Python, Django, AWS, CI/CD, Docker"
Resume has: "Python, Flask, EC2, GitHub Actions"
WRONG: Remove Flask, add Django
RIGHT: Keep Flask, highlight AWS/EC2 experience, mention Docker familiarity in projects

Return ONLY JSON, no markdown code blocks.
"""

        user_message = f"""CANDIDATE RESUME:
{resume_text}

TARGET JOB:
{job_text}

ATS MATCH ANALYSIS:
{json.dumps(match_result.model_dump(), indent=2)}
{experience_note}
CRITICAL: 
- Preserve ALL original skills exactly
- Only enhance achievements if they can be quantified or strengthened
- Add job-relevant keywords to summary
- Keep candidate's authentic voice
- Return ONLY JSON
"""

        response = await self._call_llm(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            model_config=LLM_MODELS[ModelTier.PREMIUM],
        )

        json_str = self._extract_json(response)
        data = json.loads(json_str)

        return TailoredResumeSchema(**data)

    def _extract_json(self, text: str) -> str:
        """Extract JSON from LLM response, handling markdown code blocks"""
        if not text:
            raise ValueError("Empty response from LLM")
        text = text.strip()

        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]

        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        json_match = None
        try:
            json_match = json.loads(text)
            return text
        except json.JSONDecodeError:
            match = None

        try:
            import re

            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return match.group()
        except:
            pass

        raise Exception(f"Could not extract JSON from response: {text[:200]}...")

    def _resume_to_text(self, resume: ResumeSchema) -> str:
        """Convert ResumeSchema to readable text for LLM"""
        parts = []

        if resume.basics:
            b = resume.basics
            parts.append(f"NAME: {b.name}")
            if b.label:
                parts.append(f"TITLE: {b.label}")
            if b.email:
                parts.append(f"EMAIL: {b.email}")
            if b.phone:
                parts.append(f"PHONE: {b.phone}")
            if b.summary:
                parts.append(f"\nSUMMARY:\n{b.summary}")

        if resume.skills:
            parts.append("\nSKILLS:")
            for skill in resume.skills:
                parts.append(f"  {skill.name}: {', '.join(skill.keywords)}")

        if resume.work:
            parts.append("\nEXPERIENCE:")
            for job in resume.work:
                parts.append(f"\n  {job.position} at {job.name}")
                if job.start_date or job.end_date:
                    dates = f"{job.start_date or '?'} to {job.end_date or 'Present'}"
                    parts.append(f"  Duration: {dates}")
                if job.summary:
                    parts.append(f"  {job.summary}")
                if job.highlights:
                    for h in job.highlights:
                        parts.append(f"    - {h}")

        if resume.education:
            parts.append("\nEDUCATION:")
            for edu in resume.education:
                parts.append(f"  {edu.study_type} in {edu.area}")
                parts.append(f"  {edu.institution}")
                if edu.start_date or edu.end_date:
                    parts.append(f"  {edu.start_date or ''} - {edu.end_date or ''}")

        if resume.projects:
            parts.append("\nPROJECTS:")
            for proj in resume.projects:
                parts.append(f"  {proj.name}: {proj.description}")
                if proj.highlights:
                    for h in proj.highlights:
                        parts.append(f"    - {h}")

        if resume.certificates:
            parts.append("\nCERTIFICATIONS:")
            for cert in resume.certificates:
                parts.append(f"  {cert.name} - {cert.issuer}")

        return "\n".join(parts)

    def _job_to_text(self, job: JobAnalysis) -> str:
        """Convert JobAnalysis to readable text for LLM"""
        parts = []

        parts.append(f"POSITION: {job.job_title}")
        if job.company_name:
            parts.append(f"COMPANY: {job.company_name}")
        if job.location:
            parts.append(f"LOCATION: {job.location}")

        if job.required_skills:
            parts.append(f"\nREQUIRED SKILLS: {', '.join(job.required_skills)}")
        if job.preferred_skills:
            parts.append(f"PREFERRED SKILLS: {', '.join(job.preferred_skills)}")
        if job.tools_and_technologies:
            parts.append(
                f"TOOLS & TECHNOLOGIES: {', '.join(job.tools_and_technologies)}"
            )

        if job.responsibilities:
            parts.append("\nKEY RESPONSIBILITIES:")
            for r in job.responsibilities[:5]:
                parts.append(f"  - {r}")

        if job.qualifications:
            parts.append("\nQUALIFICATIONS:")
            for q in job.qualifications[:5]:
                parts.append(f"  - {q}")

        if job.soft_skills:
            parts.append(f"\nSOFT SKILLS WANTED: {', '.join(job.soft_skills)}")

        if job.is_weak_description and job.weak_description_notes:
            parts.append("\n⚠️ WEAK JOB DESCRIPTION NOTES:")
            for note in job.weak_description_notes:
                parts.append(f"  - {note}")

        return "\n".join(parts)

    async def full_pipeline(
        self,
        raw_resume_text: str,
        job_description: str,
        experience_years_strategy: str = "default",
    ) -> tuple[TailoredResumeSchema, JobAnalysis, MatchScoreResult]:
        """
        Run the complete resume tailoring pipeline.
        Returns tailored resume, job analysis, and match result.
        """
        import asyncio

        raw_resume_text = self.normalize_unicode(raw_resume_text)
        job_description = self.normalize_unicode(job_description)

        resume, job = await asyncio.gather(
            self.step1_extract_structure(raw_resume_text),
            self.step2_analyze_job(job_description),
        )

        match_result = await self.step3_calculate_match(resume, job)

        tailored = await self.step4_tailor_resume(
            resume, job, match_result, experience_years_strategy
        )

        return tailored, job, match_result
