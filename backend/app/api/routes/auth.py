from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.database import get_db, Profile, get_or_create_credits

router = APIRouter()


@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Clerk webhooks for user creation/deletion"""
    body = await request.json()
    
    event_type = body.get("type")
    data = body.get("data", {})
    
    if event_type == "user.created":
        clerk_id = data.get("id")
        email = data.get("email_addresses", [{}])[0].get("email_address", "")
        full_name = data.get("full_name", "")
        
        profile = Profile(
            clerk_id=clerk_id,
            email=email,
            full_name=full_name
        )
        db.add(profile)
        db.commit()
        
        get_or_create_credits(db, clerk_id)
        
    elif event_type == "user.deleted":
        clerk_id = data.get("id")
        profile = db.query(Profile).filter(Profile.clerk_id == clerk_id).first()
        if profile:
            db.delete(profile)
            db.commit()
    
    return {"status": "received"}
