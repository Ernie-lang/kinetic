from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.workout import Workout
from datetime import datetime, timedelta
from typing import Dict, List


class AnalyticsService:

    @staticmethod
    def get_dashboard_stats(db: Session, user_id: int) -> Dict:
        """Get key stats for dashboard"""

        # Total activities
        total_activities = db.query(Workout).filter(Workout.user_id == user_id).count()

        # This weeks activities
        week_ago = datetime.utcnow() - timedelta(days=7)
        this_week = db.query(Workout).filter(
            Workout.user_id == user_id,
            Workout.start_date >= week_ago
        ).count()

        # Calculate training load
        week_workouts = db.query(Workout).filter(
            Workout.user_id == user_id,
            Workout.start_date >= week_ago
        ).all()

        training_load = sum(w.moving_time for w in week_workouts if w.moving_time) / 3600
        training_load = round(training_load, 1)

        return{
            "total_activities": total_activities,
            "this_week": this_week,
            "training_load": training_load
        }

    @staticmethod
    def get_weekly_summary(db: Session, user_id: int) -> Dict:
        """Get summary of last 7"""
        week_ago = datetime.utcnow() - timedelta(days=7)

        workouts = db.query(Workout).filter(
            Workout.user_id == user_id,
            Workout.start_date >= week_ago
        ).all()

        total_distance = sum(w.distance for w in workouts if w.distance) / 1000
        total_time = sum(w.moving_time for w in workouts if w.moving_time) / 3600

        activity_types = {}
        for w in workouts:
            activity_types[w.type] = activity_types.get(w.type, 0) + 1

        return {
            "total_workouts": len(workouts),
            "total_distance_km": round(total_distance, 1),
            "total_time_hours": round(total_time, 1),
            "activity_breakdown": activity_types
        }

    @staticmethod
    def get_workout_context(db: Session, user_id: int, limit: int = 10) -> str:
        """Get recent workout context for AI chat"""

        workouts = db.query(Workout).filter(
            Workout.user_id == user_id
        ).order_by(Workout.start_date.desc()).limit(limit).all()

        if not workouts:
            return "No workouts found for this user."

        context_lines = ["Recent workouts:"]
        for w in workouts:
            distance_km = round(w.distance / 1000, 2) if w.distance else 0
            duration_min = round(w.moving_time / 60) if w.moving_time else 0

            line = f"- {w.name} ({w.type}): {distance_km}km, {duration_min}min"
            if w.average_heartrate:
                line += f", avg HR: {w.average_heartrate}bpm"

            context_lines.append(line)

        return "\n".join(context_lines)