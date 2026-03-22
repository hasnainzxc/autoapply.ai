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
        model_id=os.getenv("LLM_CHEAP_MODEL", "anthropic/claude-3-haiku"),
        max_tokens=1024,
        temperature=0.3,
    ),
    ModelTier.STANDARD: ModelConfig(
        tier=ModelTier.STANDARD,
        model_id=os.getenv("LLM_STANDARD_MODEL", "deepseek/deepseek-chat-v3"),
        max_tokens=2048,
        temperature=0.4,
    ),
    ModelTier.PREMIUM: ModelConfig(
        tier=ModelTier.PREMIUM,
        model_id=os.getenv("LLM_PREMIUM_MODEL", "anthropic/claude-sonnet-4-5"),
        max_tokens=4096,
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

    async def _call_llm(
        self,
        messages: List[Dict[str, str]],
        model_config: ModelConfig,
        retry_count: int = 3,
    ) -> str:
        """Make API call to OpenRouter with retry logic"""

        for attempt in range(retry_count):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
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

    async def step4_tailor_resume(
        self, resume: ResumeSchema, job: JobAnalysis, match_result: MatchScoreResult
    ) -> TailoredResumeSchema:
        """
        Step 4: Tailor resume for the specific job.
        Uses PREMIUM model - this is the most important step.
        """
        resume_text = self._resume_to_text(resume)
        job_text = self._job_to_text(job)

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
        self, raw_resume_text: str, job_description: str
    ) -> tuple[TailoredResumeSchema, JobAnalysis, MatchScoreResult]:
        """
        Run the complete resume tailoring pipeline.
        Returns tailored resume, job analysis, and match result.
        """
        import asyncio

        resume, job, match_result = await asyncio.gather(
            self.step1_extract_structure(raw_resume_text),
            self.step2_analyze_job(job_description),
            None,
        )

        match_result = await self.step3_calculate_match(resume, job)

        tailored = await self.step4_tailor_resume(resume, job, match_result)

        return tailored, job, match_result
