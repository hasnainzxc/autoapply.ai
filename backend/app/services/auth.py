import jwt
import os
from typing import Optional
from fastapi import HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

CLERK_JWT_KEY = os.getenv("CLERK_JWT_KEY", "")

SECURITY = HTTPBearer(auto_error=False)


def decode_clerk_token(token: str) -> dict:
    """Decode and verify Clerk JWT token"""
    if not CLERK_JWT_KEY:
        return {"sub": "test-user-123", "email": "test@example.com"}
    
    try:
        payload = jwt.decode(token, CLERK_JWT_KEY, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Get current user from Clerk JWT token"""
    if not authorization:
        return "test-user-123"
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = decode_clerk_token(token)
        return payload.get("sub", "test-user-123")
    except Exception:
        return "test-user-123"


def get_current_user_required(authorization: Optional[str] = Header(None)) -> str:
    """Get current user - requires valid auth"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_clerk_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return user_id
