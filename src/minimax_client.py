import json
from typing import Optional, List, Dict, Any
from openai import OpenAI

from config import config
from logger import SleekLogger


class MiniMaxClient:
    def __init__(self):
        self.logger = SleekLogger("MiniMax")
        self.client = OpenAI(
            api_key=config.minimax_api_key,
            base_url=config.minimax_base_url,
        )
        self.model = config.minimax_model
    
    def chat(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 8192,
    ) -> str:
        self.logger.thinking(f"Sending request to MiniMax ({self.model})")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": message})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        self.logger.success("Response received from MiniMax")
        return response.choices[0].message.content
    
    def chat_json(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
    ) -> Dict[str, Any]:
        full_prompt = f"""{system_prompt or ''}

Output ONLY valid JSON. No markdown, no explanations."""
        
        response = self.chat(full_prompt, temperature=temperature)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            self.logger.error("Failed to parse JSON from MiniMax response")
            raise
    
    def craft_resume(self, job_data: dict, user_bio: str) -> dict:
        system_prompt = """You are an expert Career Coach and ATS specialist. 
Analyze the provided job description for keywords, technical requirements, and tone. 
Rewrite the user's base resume to align with these keywords while maintaining 100% honesty.

Use STAR format (Situation, Task, Action, Result) for accomplishments.
Output the result in structured JSON with:
- tailored_summary
- key_skills (matched to job)
- work_experience (tailored)
- education
"""
        
        prompt = f"""Job Description:
Title: {job_data.get('title')}
Company: {job_data.get('company')}
Description: {job_data.get('description')}

User Bio:
{user_bio}

Tailor the resume to this job."""
        
        return self.chat_json(prompt, system_prompt, temperature=config.temperature_resume)
    
    def write_cover_letter(self, job_data: dict, user_bio: str) -> str:
        system_prompt = """You are an expert Cover Letter writer. 
Write a compelling, personalized cover letter that:
1. Addresses the specific job requirements
2. Highlights relevant experience from the user's bio
3. Shows enthusiasm for the company
4. Maintains a professional yet engaging tone

Keep it to 3-4 paragraphs maximum."""
        
        prompt = f"""Job: {job_data.get('title')} at {job_data.get('company')}
Description: {job_data.get('description')[:1000]}

My Background:
{user_bio}

Write my cover letter."""
        
        return self.chat(prompt, system_prompt, temperature=config.temperature_cover_letter)
