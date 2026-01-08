from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.base import get_db
from app.services.sport_analytics import (
    get_running_analytics,
    get_cycling_analytics,
    get_swimming_analytics
)

router = APIRouter(prefix="/api/analytics", tags=["sport_analytics"])

@router.get("/running/{user_id}")
async def get_running_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive running analytics for a user
    Includes: overview, personal records, weekly progress, recent activities
    """
    try:
        analytics = get_running_analytics(db, user_id)
        return analytics
    except Exception as e:
        print(f"Error in get_running_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cycling/{user_id}")
async def get_cycling_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive cycling analytics for a user
    Includes: overview, personal records, weekly progress, recent activities
    """
    try:
        analytics = get_cycling_analytics(db, user_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/swimming/{user_id}")
async def get_swimming_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive swimming analytics for a user
    Includes: overview, personal records, weekly progress, recent activities
    """
    try:
        analytics = get_swimming_analytics(db, user_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
