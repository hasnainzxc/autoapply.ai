from celery_app import celery_app
from app.services.supabase import supabase_client
import os
import random


@celery_app.task(bind=True, max_retries=2)
def apply_to_job_task(self, application_id: str):
    """Browser automation to apply to job"""
    try:
        # Update status
        supabase_client.get_table("applications").update({
            "status": "applying"
        }).eq("id", application_id).execute()
        
        # Get application details
        app_response = supabase_client.get_table("applications").select("*").eq("id", application_id).execute()
        
        if not app_response.data:
            raise Exception("Application not found")
        
        application = app_response.data[0]
        job_url = application["job_url"]
        
        # Get tailored resume
        tailored_resume = application.get("tailored_resume", {})
        
        # Browser automation logic here
        # Use Playwright with human-like delays
        
        # Example pseudo-code:
        # async with async_playwright() as p:
        #     browser = await p.chromium.launch()
        #     page = await browser.new_page()
        #     
        #     # Human-like typing
        #     await page.goto(job_url)
        #     await human_type(page, "#name", tailored_resume.get("tailored_summary", ""))
        #     
        #     # Random delays
        #     await asyncio.sleep(random.uniform(1, 3))
        #     
        #     # Submit
        #     await page.click("button[type='submit']")
        
        # Mark as confirmed
        supabase_client.get_table("applications").update({
            "status": "confirmed",
            "applied_at": "now()",
            "updated_at": "now()"
        }).eq("id", application_id).execute()
        
        return {"status": "applied", "application_id": application_id}
        
    except Exception as e:
        # Increment retry count
        app_response = supabase_client.get_table("applications").select("retry_count").eq("id", application_id).execute()
        retry_count = (app_response.data[0].get("retry_count") or 0) + 1
        
        supabase_client.get_table("applications").update({
            "status": "failed" if retry_count >= 2 else "applying",
            "error_message": str(e),
            "retry_count": retry_count,
            "updated_at": "now()"
        }).eq("id", application_id).execute()
        
        if retry_count < 2:
            raise self.retry(exc=e)


def human_type(page, selector, text):
    """Human-like typing with random delays"""
    import asyncio
    
    async def type_human():
        await page.click(selector)
        for char in text:
            await page.type(selector, char, delay=random.randint(50, 150))
            # 5% chance of "typo" and correction
            if random.random() < 0.05:
                await page.keyboard.press("Backspace")
                await asyncio.sleep(random.uniform(0.1, 0.3))
    
    return asyncio.run(type_human())
