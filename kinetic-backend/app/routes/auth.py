from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
import os
from app.database.base import get_db
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

STRAVA_DEAUTH_URL = "https://www.strava.com/oauth/deauthorize"

class LogoutRequest(BaseModel):
    user_id: int

@router.post("/logout")
async def logout(
    request: LogoutRequest,
    db: Session = Depends(get_db)
):
    """
    Logout user and revoke Strava access token
    """
    user = db.query(User).filter(User.id == request.user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Revoke Strava token if it exists
    if user.strava_access_token:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    STRAVA_DEAUTH_URL,
                    data={"access_token": user.strava_access_token}
                )
                if response.status_code != 200:
                    print(f"Warning: Strava token revocation failed with status {response.status_code}")
            except Exception as e:
                print(f"Error revoking Strava token: {str(e)}")
    
    user.strava_access_token = None
    user.strava_refresh_token = None
    user.strava_token_expires_at = None
    db.commit()
    
    return {
        "success": True,
        "message": "Logged out successfully"
    }