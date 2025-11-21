from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.base import get_db
from app.models.workout import Workout

router = APIRouter()

@router.get("/workouts/{user_id}")
async def get_user_workouts(user_id: int, db: Session = Depends(get_db)):
    """Get all workouts for a user"""
    workouts = db.query(Workout).filter(
        Workout.user_id == user_id
    ).order_by(Workout.start_date.desc()).all()
    return workouts