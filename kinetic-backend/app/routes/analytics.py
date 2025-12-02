from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models.user import User
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard/{user_id}")
async def get_dashboard_stats(user_id: int, db: Session = Depends(get_db)):
    """Get dashboard statistics for a user"""

    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stats = AnalyticsService.get_dashboard_stats(db, user_id)

    return {
        "total_activities": stats["total_activities"],
        "this_week": stats["this_week"],
        "training_load": stats["training_load"]
    }

@router.get("/weekly/{user_id}")
async def get_weekly_summary(user_id: int, db: Session = Depends(get_db)):
    """Get weekly training summary for a user"""

    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    summary = AnalyticsService.get_weekly_summary(db, user_id)

    return summary
    
    