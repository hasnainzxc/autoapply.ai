from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.supabase import supabase_client

router = APIRouter()


class CreditPurchase(BaseModel):
    amount: int
    stripe_payment_intent_id: str


class CreditResponse(BaseModel):
    balance: int
    lifetime_purchased: int
    lifetime_used: int
    subscription_tier: str


def get_current_user() -> str:
    return "placeholder-user-id"


@router.get("/credits/balance", response_model=CreditResponse)
async def get_credit_balance(current_user: str = Depends(get_current_user)):
    """Get user's credit balance"""
    response = supabase_client.get_table("credits").select("*").eq("user_id", current_user).execute()
    
    if not response.data:
        # Create default credits entry
        new_response = supabase_client.get_table("credits").insert({
            "user_id": current_user,
            "balance": 5,  # Free credits for signup
            "lifetime_purchased": 5,
            "lifetime_used": 0,
            "subscription_tier": "free"
        }).execute()
        return new_response.data[0]
    
    return response.data[0]


@router.post("/credits/purchase")
async def purchase_credits(
    purchase: CreditPurchase,
    current_user: str = Depends(get_current_user)
):
    """Purchase credits via Stripe"""
    # Verify Stripe payment
    # In production, verify payment_intent_id with Stripe API
    
    credits_to_add = purchase.amount
    
    # Get current credits
    response = supabase_client.get_table("credits").select("*").eq("user_id", current_user).execute()
    
    if not response.data:
        new_response = supabase_client.get_table("credits").insert({
            "user_id": current_user,
            "balance": credits_to_add,
            "lifetime_purchased": credits_to_add,
            "lifetime_used": 0
        }).execute()
    else:
        current = response.data[0]
        supabase_client.get_table("credits").update({
            "balance": current["balance"] + credits_to_add,
            "lifetime_purchased": current.get("lifetime_purchased", 0) + credits_to_add,
            "updated_at": "now()"
        }).eq("user_id", current_user).execute()
    
    # Record transaction
    supabase_client.get_table("credit_transactions").insert({
        "user_id": current_user,
        "amount": credits_to_add,
        "type": "purchase",
        "description": f"Purchased {credits_to_add} credits",
        "stripe_payment_id": purchase.stripe_payment_intent_id
    }).execute()
    
    return {
        "status": "success",
        "credits_added": credits_to_add
    }
