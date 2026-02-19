from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.database import get_db, Credit, get_or_create_credits, CreditTransaction
from app.services.auth import get_current_user

router = APIRouter()


class CreditPurchase(BaseModel):
    amount: int
    stripe_payment_intent_id: str


class CreditResponse(BaseModel):
    balance: int
    lifetime_purchased: int
    lifetime_used: int
    subscription_tier: str


@router.get("/credits/balance", response_model=CreditResponse)
async def get_credit_balance(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get user's credit balance"""
    credit = get_or_create_credits(db, current_user)
    
    return {
        "balance": credit.balance,
        "lifetime_purchased": 5,
        "lifetime_used": credit.lifetime_used,
        "subscription_tier": "free"
    }


@router.post("/credits/purchase")
async def purchase_credits(
    purchase: CreditPurchase,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Purchase credits via Stripe"""
    credits_to_add = purchase.amount
    
    credit = get_or_create_credits(db, current_user)
    credit.balance = (credit.balance or 0) + credits_to_add
    db.commit()
    
    transaction = CreditTransaction(
        user_id=current_user,
        amount=credits_to_add,
        type="purchase",
        description=f"Purchased {credits_to_add} credits"
    )
    db.add(transaction)
    db.commit()
    
    return {
        "status": "success",
        "credits_added": credits_to_add,
        "new_balance": credit.balance
    }
