from fastapi import APIRouter, Depends
from typing import List
from app.schemas.application import ApplicationResponse, ApplicationUpdate
from app.services.supabase import supabase_client

router = APIRouter()


def get_current_user() -> str:
    return "placeholder-user-id"


@router.get("/applications", response_model=List[ApplicationResponse])
async def list_applications(
    current_user: str = Depends(get_current_user),
    status: str = None
):
    """List user's applications"""
    query = supabase_client.get_table("applications").select("*").eq("user_id", current_user)
    
    if status:
        query = query.eq("status", status)
    
    response = query.order("created_at", desc=True).execute()
    return response.data


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get application details"""
    response = supabase_client.get_table("applications").select("*").eq("id", application_id).eq("user_id", current_user).execute()
    
    if not response.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Application not found")
    
    return response.data[0]


@router.delete("/applications/{application_id}")
async def cancel_application(
    application_id: str,
    current_user: str = Depends(get_current_user)
):
    """Cancel a queued application"""
    response = supabase_client.get_table("applications").select("*").eq("id", application_id).eq("user_id", current_user).execute()
    
    if not response.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Application not found")
    
    app = response.data[0]
    
    if app["status"] not in ["queued", "scraping"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot cancel application in current state")
    
    # Update status to failed
    supabase_client.get_table("applications").update({
        "status": "failed",
        "error_message": "Cancelled by user",
        "updated_at": "now()"
    }).eq("id", application_id).execute()
    
    # Refund credit
    credits_response = supabase_client.get_table("credits").select("*").eq("user_id", current_user).execute()
    if credits_response.data:
        supabase_client.get_table("credits").update({
            "balance": credits_response.data[0]["balance"] + 1,
            "lifetime_used": credits_response.data[0].get("lifetime_used", 1) - 1
        }).eq("user_id", current_user).execute()
        
        supabase_client.get_table("credit_transactions").insert({
            "user_id": current_user,
            "amount": 1,
            "type": "refunded",
            "description": f"Refunded for cancelled application"
        }).execute()
    
    return {"status": "cancelled"}
