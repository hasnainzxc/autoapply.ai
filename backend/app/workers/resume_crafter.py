from celery_app import celery_app
from app.services.supabase import supabase_client
import httpx
import json
import os


@celery_app.task(bind=True, max_retries=3)
def calculate_match_score_task(self, job_url: str, user_id: str):
    """Calculate match score between user profile and job"""
    try:
        # Update status
        supabase_client.get_table("applications").update({
            "status": "analyzing"
        }).eq("job_url", job_url).eq("user_id", user_id).execute()
        
        # Get user profile
        profile_response = supabase_client.get_table("profiles").select("*").eq("clerk_id", user_id).execute()
        
        if not profile_response.data:
            raise Exception("User profile not found")
        
        user_profile = profile_response.data[0]
        
        # Scrape job description (simplified - use actual scraper)
        job_description = f"Sample job description from {job_url}"
        
        # Call OpenRouter for scoring (using cheap model)
        async def get_match_score():
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "qwen/qwen-2.5-7b-instruct",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a job matching algorithm. Rate how well the candidate fits the job from 0-100. Return only a number."
                            },
                            {
                                "role": "user",
                                "content": f"Job: {job_description}\n\nCandidate: {user_profile.get('base_resume', '')}"
                            }
                        ],
                        "max_tokens": 10
                    }
                )
                result = response.json()
                score_text = result["choices"][0]["message"]["content"]
                # Extract number from response
                score = int(''.join(filter(str.isdigit, score_text))) or 50
                return min(max(score, 0), 100)
        
        # Run sync (in production, use asyncio.run or make async)
        import asyncio
        match_score = asyncio.run(get_match_score())
        
        # Update application with score
        supabase_client.get_table("applications").update({
            "match_score": match_score,
            "status": "analyzing",
            "updated_at": "now()"
        }).eq("job_url", job_url).eq("user_id", user_id).execute()
        
        return {"match_score": match_score}
        
    except Exception as e:
        supabase_client.get_table("applications").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("job_url", job_url).eq("user_id", user_id).execute()
        raise self.retry(exc=e)


@celery_app.task(bind=True, max_retries=3)
def craft_resume_task(self, job_url: str, user_id: str):
    """Craft tailored resume for the job"""
    try:
        # Update status
        supabase_client.get_table("applications").update({
            "status": "crafting"
        }).eq("job_url", job_url).eq("user_id", user_id).execute()
        
        # Get user profile
        profile_response = supabase_client.get_table("profiles").select("*").eq("clerk_id", user_id).execute()
        
        if not profile_response.data:
            raise Exception("User profile not found")
        
        user_profile = profile_response.data[0]
        
        # In production, scrape full job description
        job_description = f"Full job description from {job_url}"
        
        # Call LLM to craft resume
        async def craft_resume():
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "qwen/qwen-2.5-7b-instruct",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an expert resume writer. Tailor the resume to match the job. Return JSON with: tailored_summary, key_skills (array), work_experience (array), education (array), ats_score_estimate (0-100)."
                            },
                            {
                                "role": "user",
                                "content": f"Job Description: {job_description}\n\nBase Resume: {user_profile.get('base_resume', '')}"
                            }
                        ],
                        "max_tokens": 2000
                    }
                )
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                # Parse JSON from response
                tailored_resume = json.loads(content)
                return tailored_resume
        
        import asyncio
        tailored_resume = asyncio.run(craft_resume())
        
        # Update application with tailored resume
        supabase_client.get_table("applications").update({
            "tailored_resume": tailored_resume,
            "status": "crafting",
            "updated_at": "now()"
        }).eq("job_url", job_url).eq("user_id", user_id).execute()
        
        return tailored_resume
        
    except Exception as e:
        supabase_client.get_table("applications").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("job_url", job_url).eq("user_id", user_id).execute()
        raise self.retry(exc=e)
