"""
Strava OAuth and Sync Endpoints
"""

from sqlite3 import paramstyle
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
import httpx
import os
from datetime import datetime
from typing import Optional
from app.database.base import get_db
from app.models.user import User
from app.models.workout import Workout

router = APIRouter(prefix="/api/strava", tags=["strava"])

# Environment variables
STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.getenv("STRAVA_REDIRECT_URI", "http://localhost:5173/auth/callback")

# Strava API endpoints
STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_BASE = "https://www.strava.com/api/v3"

@router.get("/auth/url")
async def handle_callback(
    code: str,
    db: Session = Depends(get_db),
):
    """
    Exchange Strava auth code for access token
    Create or update user with Strava data
    """
    async with httpx.AsyncClient() as client:
        try:
            # Exchange code for access token
            token_response = await client.post(
                STRAVA_TOKEN_URL,
                data={
                    "client_id": STRAVA_CLIENT_ID,
                    "client_secret": STRAVA_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code"
                }
            )
            response.raise_for_status()
            data = response.json()

            athlete = data.get["athlete"]

            # Check if user exists
            user = db.query(User).filter(User.strava_athlete_id == athlete.get["id"]).first()

            if not user:
                # Create new user
                user = User(
                    email=athlete.get("email", f"user{athlete.get['id']}@strava.local"),
                    first_name=athlete.get("firstname"),
                    last_name=athlete.get("lastname"),
                    profile_photo=athlete.get("profile"),
                    strava_id=str(athlete.get["id"]),
                    strava_athlete_id=athlete["id"],
                    strava_access_token=data["access_token"],
                    strava_refresh_token=data["refresh_token"],
                    strava_token_expires_at=datetime.fromtimestamp(data["expires_at"]),
                )
                db.add(user)
            else:
                # Update existing user
                user.strava_access_token = data["access_token"]
                user.strava_refresh_token = data["refresh_token"]
                user.strava_token_expires_at = datetime.fromtimestamp(data["expires_at"])
                user.first_name = athlete.get("firstname")
                user.last_name = athlete.get("lastname")
                user.profile_photo = athlete.get("profile")
            
            db.commit()
            db.refresh(user)

            return {
                "success": True,
                "user_id": user.id,
                "athlete": athlete,
            }

        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=400, detail=f"Strava API Error: {str(e)}")

async def refresh_strava_token(user: User, dp: Session):
    """ Refresh expired Strava access token """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            STRAVA_TOKEN_URL,
            data={
                "client_id": STRAVA_CLIENT_ID,
                "client_secret": STRAVA_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": user.strava_refresh_token,
            }
        )
        response.raise_for_status()
        data = response.json()

        user.strava_access_token = data["access token"]
        user.strava_refresh_token = data["refresh token"]
        user.strava_token_expires_at = datetime.fromtimestamp(data["expires_at"])
        db.commit()

        return data["access_token"]

async def get_valid_token(user: User, db: Session):
    """Get valid access token, refreshing if necessary"""
    if datetime.now() >= user.strava_token_expires_at:
        return await refresh_strava_token(user, db)
    return user.strava_access_token

@router.post("/sync/{user_id}")
async def sync_workouts(
    user_id: int,
    after: Optional[int] = Query(None, description="Timestamp to fetch activities after"),
    db: Session = Depends(get_db)
):
    """ Fetch workouts from Strava and store in database """

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.strava_access_token:
        raise HTTPException(status_code=404, detail="Strava not connected")

    token = await get_valid_token(user, db)

    async with httpx.AsyncClient() as client:
        try:
            # Fetch activities
            params = {"per_page": 200}
            if after:
                params["after"] = after
            
            response = await client.get(
                f"{STRAVA_API_BASE}/athlete/activities",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
            response.raise_for_status()
            activities = response.json()

            # Store activities in database
            new_count = 0
            for activity in activities:
                # Check if activity already exists
                existing = db.query(Workout).filter(
                    Workout.strava_id == activity["id"]
                ).first()

                if not existing:
                    workout = Workout(
                        user_id=user.id,
                        strava_id=activity["id"],
                        name=activity["name"],
                        type=activity["type"],
                        start_date=datetime.fromisoformat(activity["start_date"].replace("Z", "+00:00")),
                        distance=activity.get("distance", 0),
                        moving_time=activity.get("moving_time", 0),
                        elapsed_time=activity.get("elapsed_time", 0),
                        total_elevation_gain=activity.get("total_elevation_gain", 0),
                        average_speed=activity.get("average_speed", 0),
                        max_speed=activity.get("max_speed", 0),
                        average_heartrate=activity.get("average_heartrate"),
                        max_heartrate=activity.get("max_heartrate"),
                        suffer_score=activity.get("suffer_score")
                    )
                    db.add(workout)
                    new_count += 1

            db.commit()

            return {
                "success": True,
                "total_activities": len(activities),
                "new_activities": new_count
            }

        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Strava API error: {str(e)}")

@router.get("/status/{user_id}")
async def get_strava_status(user_id: int, db: Session = Depends(get_db)):
    """ Check if user has connected """
    user = db.query(User).filer(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "connected": bool(user.strava_access_token),
        "athlete_id": user.strava_athlete_id,
        "name": f"{user.first_name} {user.last_name}" if user.first_name else None
    }

@router.delete("/disconnect/{user_id}")
async def disconnect_strava(user_id: int, db: Session = Depends(get_db)):
    """ Disconnect Strava account """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.strava_access_token = None
    user.strava_refresh_token = None
    user.strava_token_expires_at = None
    db.commit()

    return {"success": True}