from fastapi import APIRouter, Request, HTTPException
from app.services.supabase import supabase_client

router = APIRouter()


@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    """Handle Clerk webhooks for user creation/deletion"""
    body = await request.json()
    
    event_type = body.get("type")
    data = body.get("data", {})
    
    if event_type == "user.created":
        clerk_id = data.get("id")
        email = data.get("email_addresses", [{}])[0].get("email_address", "")
        full_name = data.get("full_name", "")
        
        supabase_client.get_table("profiles").insert({
            "clerk_id": clerk_id,
            "email": email,
            "full_name": full_name,
        }).execute()
        
    elif event_type == "user.deleted":
        clerk_id = data.get("id")
        supabase_client.get_table("profiles").delete().eq("clerk_id", clerk_id).execute()
    
    return {"status": "received"}
