from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models.workout import Workout


def calculate_pace(distance_km: float, time_seconds: int) -> str:
    """
    Convert distance and time to pace format (min/km)
    Example: 10km in 3000 seconds = 5:00 min/km
    """
    if distance_km == 0:
        return "0:00"
    pace_seconds = time_seconds / distance_km
    minutes = int(pace_seconds // 60)
    seconds = int(pace_seconds % 60)
    return f"{minutes}:{seconds:02d}"


def format_time(seconds: int) -> str:
    """
    Convert seconds to mm:ss or HH:mm:ss format
    """
    if seconds < 3600:
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}:{secs:02d}"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours}:{minutes:02d}:{secs:02d}"


def calculate_speed(distance_km: float, time_seconds: int) -> float:
    """Calculate speed in km/h"""
    if time_seconds == 0:
        return 0.0
    time_hours = time_seconds / 3600
    return distance_km / time_hours


def get_running_analytics(db: Session, user_id: int) -> Dict:
    """
    Calculate comprehensive running analytics including overview, PRs, progress, and recent activities
    """
    # Get all running workouts
    workouts = db.query(Workout).filter(
        and_(
            Workout.user_id == user_id,
            Workout.type == 'Run'
        )
    ).order_by(Workout.start_date).all()
    
    if not workouts:
        return {
            "overview": {
                "total_distance": 0,
                "monthly_distance": 0,
                "average_pace": "0:00",
                "total_runs": 0
            },
            "personal_records": {},
            "progress": [],
            "recent_activities": []
        }
    
    # Calculate overview
    total_distance_m = sum(w.distance or 0 for w in workouts)
    total_time_s = sum(w.moving_time or 0 for w in workouts)
    total_distance_km = total_distance_m / 1000
    
    # This month's stats
    now = datetime.now()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_workouts = [w for w in workouts if w.start_date >= first_day_of_month]
    monthly_distance_km = sum(w.distance or 0 for w in month_workouts) / 1000
    
    # Average pace
    avg_pace = calculate_pace(total_distance_km, total_time_s) if total_distance_km > 0 else "0:00"
    
    # Personal Records
    records = {}
    
    # Longest run
    longest = max(workouts, key=lambda w: w.distance or 0)
    if longest.distance:
        records["longest_run"] = {
            "distance": round(longest.distance / 1000, 2),
            "date": longest.start_date.strftime("%Y-%m-%d"),
            "workout_id": longest.id
        }
    
    # Best pace (for runs > 3km to avoid sprints)
    valid_pace_runs = [w for w in workouts if w.distance and w.moving_time and (w.distance / 1000) >= 3]
    if valid_pace_runs:
        best_pace_run = min(valid_pace_runs, 
                           key=lambda w: w.moving_time / (w.distance / 1000))
        records["best_pace"] = {
            "pace": calculate_pace(best_pace_run.distance / 1000, best_pace_run.moving_time),
            "distance": round(best_pace_run.distance / 1000, 2),
            "date": best_pace_run.start_date.strftime("%Y-%m-%d"),
            "workout_id": best_pace_run.id
        }
    
    # Race distances (with tolerance)
    # 5K (4.5-5.5 km)
    five_k_runs = [w for w in workouts if w.distance and 4500 <= w.distance <= 5500 and w.moving_time]
    if five_k_runs:
        fastest_5k = min(five_k_runs, key=lambda w: w.moving_time)
        records["fastest_5k"] = {
            "time": format_time(fastest_5k.moving_time),
            "pace": calculate_pace(fastest_5k.distance / 1000, fastest_5k.moving_time),
            "date": fastest_5k.start_date.strftime("%Y-%m-%d"),
            "workout_id": fastest_5k.id
        }
    
    # 10K (9.5-10.5 km)
    ten_k_runs = [w for w in workouts if w.distance and 9500 <= w.distance <= 10500 and w.moving_time]
    if ten_k_runs:
        fastest_10k = min(ten_k_runs, key=lambda w: w.moving_time)
        records["fastest_10k"] = {
            "time": format_time(fastest_10k.moving_time),
            "pace": calculate_pace(fastest_10k.distance / 1000, fastest_10k.moving_time),
            "date": fastest_10k.start_date.strftime("%Y-%m-%d"),
            "workout_id": fastest_10k.id
        }
    
    # Half Marathon (20-22 km)
    half_runs = [w for w in workouts if w.distance and 20000 <= w.distance <= 22000 and w.moving_time]
    if half_runs:
        fastest_half = min(half_runs, key=lambda w: w.moving_time)
        records["fastest_half_marathon"] = {
            "time": format_time(fastest_half.moving_time),
            "pace": calculate_pace(fastest_half.distance / 1000, fastest_half.moving_time),
            "date": fastest_half.start_date.strftime("%Y-%m-%d"),
            "workout_id": fastest_half.id
        }
    
    # Marathon (41-43 km)
    marathon_runs = [w for w in workouts if w.distance and 41000 <= w.distance <= 43000 and w.moving_time]
    if marathon_runs:
        fastest_marathon = min(marathon_runs, key=lambda w: w.moving_time)
        records["fastest_marathon"] = {
            "time": format_time(fastest_marathon.moving_time),
            "pace": calculate_pace(fastest_marathon.distance / 1000, fastest_marathon.moving_time),
            "date": fastest_marathon.start_date.strftime("%Y-%m-%d"),
            "workout_id": fastest_marathon.id
        }
    
    # Weekly progress (last 12 weeks)
    twelve_weeks_ago = now - timedelta(weeks=12)
    recent_workouts = [w for w in workouts if w.start_date >= twelve_weeks_ago]
    
    # Group by week
    weeks_dict = {}
    for workout in recent_workouts:
        # Get Monday of the week
        week_start = workout.start_date - timedelta(days=workout.start_date.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        
        if week_key not in weeks_dict:
            weeks_dict[week_key] = []
        weeks_dict[week_key].append(workout)
    
    # Calculate weekly totals
    progress = []
    for week_start in sorted(weeks_dict.keys()):
        week_workouts = weeks_dict[week_start]
        week_distance = sum(w.distance or 0 for w in week_workouts) / 1000
        progress.append({
            "week": week_start,
            "distance": round(week_distance, 2)
        })
    
    # Recent activities (last 10)
    recent_activities = []
    for workout in sorted(workouts, key=lambda w: w.start_date, reverse=True)[:10]:
        distance_km = (workout.distance or 0) / 1000
        pace = calculate_pace(distance_km, workout.moving_time) if workout.moving_time and distance_km > 0 else "0:00"
        
        recent_activities.append({
            "id": workout.id,
            "date": workout.start_date.strftime("%Y-%m-%d"),
            "name": workout.name,
            "distance": round(distance_km, 2),
            "time": format_time(workout.moving_time) if workout.moving_time else "0:00",
            "pace": pace,
            "elevation": round(workout.total_elevation_gain or 0, 0)
        })
    
    return {
        "overview": {
            "total_distance": round(total_distance_km, 2),
            "monthly_distance": round(monthly_distance_km, 2),
            "average_pace": avg_pace,
            "total_runs": len(workouts)
        },
        "personal_records": records,
        "progress": progress,
        "recent_activities": recent_activities
    }


def get_cycling_analytics(db: Session, user_id: int) -> Dict:
    """
    Calculate comprehensive cycling analytics
    """
    workouts = db.query(Workout).filter(
        and_(
            Workout.user_id == user_id,
            Workout.type == 'Ride'
        )
    ).order_by(Workout.start_date).all()
    
    if not workouts:
        return {
            "overview": {
                "total_distance": 0,
                "monthly_distance": 0,
                "average_speed": 0,
                "total_rides": 0,
                "total_elevation": 0
            },
            "personal_records": {},
            "progress": [],
            "recent_activities": []
        }
    
    # Calculate overview
    total_distance_m = sum(w.distance or 0 for w in workouts)
    total_time_s = sum(w.moving_time or 0 for w in workouts)
    total_distance_km = total_distance_m / 1000
    total_elevation = sum(w.total_elevation_gain or 0 for w in workouts)
    
    # This month's stats
    now = datetime.now()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_workouts = [w for w in workouts if w.start_date >= first_day_of_month]
    monthly_distance_km = sum(w.distance or 0 for w in month_workouts) / 1000
    
    # Average speed
    avg_speed = calculate_speed(total_distance_km, total_time_s) if total_time_s > 0 else 0
    
    # Personal Records
    records = {}
    
    # Longest ride
    longest = max(workouts, key=lambda w: w.distance or 0)
    if longest.distance:
        records["longest_ride"] = {
            "distance": round(longest.distance / 1000, 2),
            "date": longest.start_date.strftime("%Y-%m-%d"),
            "workout_id": longest.id
        }
    
    # Biggest climb
    if any(w.total_elevation_gain for w in workouts):
        biggest_climb = max(workouts, key=lambda w: w.total_elevation_gain or 0)
        if biggest_climb.total_elevation_gain:
            records["biggest_climb"] = {
                "elevation": round(biggest_climb.total_elevation_gain, 0),
                "distance": round(biggest_climb.distance / 1000, 2),
                "date": biggest_climb.start_date.strftime("%Y-%m-%d"),
                "workout_id": biggest_climb.id
            }
    
    # Fastest average speed (for rides > 10km)
    valid_speed_rides = [w for w in workouts if w.distance and w.moving_time and (w.distance / 1000) >= 10]
    if valid_speed_rides:
        fastest_ride = max(valid_speed_rides,
                          key=lambda w: calculate_speed(w.distance / 1000, w.moving_time))
        records["fastest_speed"] = {
            "speed": round(calculate_speed(fastest_ride.distance / 1000, fastest_ride.moving_time), 2),
            "distance": round(fastest_ride.distance / 1000, 2),
            "date": fastest_ride.start_date.strftime("%Y-%m-%d"),
            "workout_id": fastest_ride.id
        }
    
    # Weekly progress (last 12 weeks)
    twelve_weeks_ago = now - timedelta(weeks=12)
    recent_workouts = [w for w in workouts if w.start_date >= twelve_weeks_ago]
    
    weeks_dict = {}
    for workout in recent_workouts:
        week_start = workout.start_date - timedelta(days=workout.start_date.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        
        if week_key not in weeks_dict:
            weeks_dict[week_key] = []
        weeks_dict[week_key].append(workout)
    
    progress = []
    for week_start in sorted(weeks_dict.keys()):
        week_workouts = weeks_dict[week_start]
        week_distance = sum(w.distance or 0 for w in week_workouts) / 1000
        week_elevation = sum(w.total_elevation_gain or 0 for w in week_workouts)
        progress.append({
            "week": week_start,
            "distance": round(week_distance, 2),
            "elevation": round(week_elevation, 0)
        })
    
    # Recent activities (last 10)
    recent_activities = []
    for workout in sorted(workouts, key=lambda w: w.start_date, reverse=True)[:10]:
        distance_km = (workout.distance or 0) / 1000
        speed = calculate_speed(distance_km, workout.moving_time) if workout.moving_time and distance_km > 0 else 0
        
        recent_activities.append({
            "id": workout.id,
            "date": workout.start_date.strftime("%Y-%m-%d"),
            "name": workout.name,
            "distance": round(distance_km, 2),
            "time": format_time(workout.moving_time) if workout.moving_time else "0:00",
            "speed": round(speed, 2),
            "elevation": round(workout.total_elevation_gain or 0, 0)
        })
    
    return {
        "overview": {
            "total_distance": round(total_distance_km, 2),
            "monthly_distance": round(monthly_distance_km, 2),
            "average_speed": round(avg_speed, 2),
            "total_rides": len(workouts),
            "total_elevation": round(total_elevation, 0)
        },
        "personal_records": records,
        "progress": progress,
        "recent_activities": recent_activities
    }


def get_swimming_analytics(db: Session, user_id: int) -> Dict:
    """
    Calculate comprehensive swimming analytics
    """
    workouts = db.query(Workout).filter(
        and_(
            Workout.user_id == user_id,
            Workout.type == 'Swim'
        )
    ).order_by(Workout.start_date).all()
    
    if not workouts:
        return {
            "overview": {
                "total_distance": 0,
                "monthly_distance": 0,
                "average_pace_per_100m": "0:00",
                "total_swims": 0
            },
            "personal_records": {},
            "progress": [],
            "recent_activities": []
        }
    
    # Calculate overview
    total_distance_m = sum(w.distance or 0 for w in workouts)
    total_time_s = sum(w.moving_time or 0 for w in workouts)
    total_distance_km = total_distance_m / 1000
    
    # This month's stats
    now = datetime.now()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_workouts = [w for w in workouts if w.start_date >= first_day_of_month]
    monthly_distance_km = sum(w.distance or 0 for w in month_workouts) / 1000
    
    # Average pace per 100m
    if total_distance_m > 0:
        pace_per_100m_seconds = total_time_s / (total_distance_m / 100)
        avg_pace_per_100m = format_time(int(pace_per_100m_seconds))
    else:
        avg_pace_per_100m = "0:00"
    
    # Personal Records
    records = {}
    
    # Longest swim
    longest = max(workouts, key=lambda w: w.distance or 0)
    if longest.distance:
        records["longest_swim"] = {
            "distance": round(longest.distance / 1000, 2),
            "date": longest.start_date.strftime("%Y-%m-%d"),
            "workout_id": longest.id
        }
    
    # Best pace per 100m
    valid_swims = [w for w in workouts if w.distance and w.moving_time and w.distance >= 100]
    if valid_swims:
        best_pace_swim = min(valid_swims,
                            key=lambda w: w.moving_time / (w.distance / 100))
        pace_seconds = best_pace_swim.moving_time / (best_pace_swim.distance / 100)
        records["best_pace_per_100m"] = {
            "pace": format_time(int(pace_seconds)),
            "distance": round(best_pace_swim.distance / 1000, 2),
            "date": best_pace_swim.start_date.strftime("%Y-%m-%d"),
            "workout_id": best_pace_swim.id
        }
    
    # Weekly progress (last 12 weeks)
    twelve_weeks_ago = now - timedelta(weeks=12)
    recent_workouts = [w for w in workouts if w.start_date >= twelve_weeks_ago]
    
    weeks_dict = {}
    for workout in recent_workouts:
        week_start = workout.start_date - timedelta(days=workout.start_date.weekday())
        week_key = week_start.strftime("%Y-%m-%d")
        
        if week_key not in weeks_dict:
            weeks_dict[week_key] = []
        weeks_dict[week_key].append(workout)
    
    progress = []
    for week_start in sorted(weeks_dict.keys()):
        week_workouts = weeks_dict[week_start]
        week_distance = sum(w.distance or 0 for w in week_workouts) / 1000
        progress.append({
            "week": week_start,
            "distance": round(week_distance, 2)
        })
    
    # Recent activities (last 10)
    recent_activities = []
    for workout in sorted(workouts, key=lambda w: w.start_date, reverse=True)[:10]:
        distance_m = workout.distance or 0
        distance_km = distance_m / 1000
        
        if distance_m > 0 and workout.moving_time:
            pace_per_100m = format_time(int(workout.moving_time / (distance_m / 100)))
        else:
            pace_per_100m = "0:00"
        
        recent_activities.append({
            "id": workout.id,
            "date": workout.start_date.strftime("%Y-%m-%d"),
            "name": workout.name,
            "distance": round(distance_km, 2),
            "time": format_time(workout.moving_time) if workout.moving_time else "0:00",
            "pace_per_100m": pace_per_100m
        })
    
    return {
        "overview": {
            "total_distance": round(total_distance_km, 2),
            "monthly_distance": round(monthly_distance_km, 2),
            "average_pace_per_100m": avg_pace_per_100m,
            "total_swims": len(workouts)
        },
        "personal_records": records,
        "progress": progress,
        "recent_activities": recent_activities
    }