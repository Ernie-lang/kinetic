from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database.base import get_db
from app.models.program import TrainingProgram, ProgramWeek, ProgramWorkout
from app.models.user import User
from app.services.program_generator import ProgramGenerator

router = APIRouter(prefix="/api/programs", tags=["programs"])

class RegenerateWeekRequest(BaseModel):
    user_id: int
    adjustment_request: str

class GenerateProgramRequest(BaseModel):
    user_id: int
    goal: str
    fitness_level: str
    days_per_week: int
    duration_weeks: int


class WorkoutResponse(BaseModel):
    id: int
    day_number: int
    workout_type: str
    description: str
    duration_minutes: Optional[int]
    intensity: str
    completed: bool

    class Config:
        from_attributes = True


class WeekResponse(BaseModel):
    id: int
    week_number: int
    weekly_goal: str
    workouts: List[WorkoutResponse]

    class Config:
        from_attributes = True


class ProgramResponse(BaseModel):
    id: int
    title: str
    description: str
    goal: str
    duration_weeks: int
    created_at: datetime
    is_active: bool
    weeks: List[WeekResponse]

    class Config:
        from_attributes = True


class ProgramSummary(BaseModel):
    id: int
    title: str
    description: str
    goal: str
    duration_weeks: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/generate", response_model=ProgramResponse)
async def generate_program(request: GenerateProgramRequest, db: Session = Depends(get_db)):
    """Generate a new training program using AI"""
    
    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Generate program with AI
        program_data = ProgramGenerator.generate_program(
            user_name=user.first_name or "there",
            goal=request.goal,
            fitness_level=request.fitness_level,
            days_per_week=request.days_per_week,
            duration_weeks=request.duration_weeks,
            db=db,
            user_id=request.user_id
        )
        
        # Create program in database
        program = TrainingProgram(
            user_id=request.user_id,
            title=program_data["title"],
            description=program_data["description"],
            goal=request.goal,
            duration_weeks=request.duration_weeks,
            is_active=True
        )
        db.add(program)
        db.flush()
        
        # Create weeks and workouts
        for week_data in program_data["weeks"]:
            week = ProgramWeek(
                program_id=program.id,
                week_number=week_data["week_number"],
                weekly_goal=week_data.get("weekly_goal", "")
            )
            db.add(week)
            db.flush()
            
            for workout_data in week_data["workouts"]:
                workout = ProgramWorkout(
                    week_id=week.id,
                    day_number=workout_data["day_number"],
                    workout_type=workout_data["workout_type"],
                    description=workout_data.get("description", ""),
                    duration_minutes=workout_data.get("duration_minutes"),
                    intensity=workout_data.get("intensity", "Moderate"),
                    completed=False
                )
                db.add(workout)
        
        db.commit()
        db.refresh(program)
        
        return program
        
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print("FULL ERROR:")
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"Error generating program: {str(e)}")


@router.get("/{user_id}", response_model=List[ProgramSummary])
async def get_user_programs(user_id: int, db: Session = Depends(get_db)):
    """Get all programs for a user"""
    programs = db.query(TrainingProgram).filter(
        TrainingProgram.user_id == user_id
    ).order_by(TrainingProgram.created_at.desc()).all()
    
    return programs


@router.get("/detail/{program_id}", response_model=ProgramResponse)
async def get_program_detail(program_id: int, db: Session = Depends(get_db)):
    """Get detailed program with all weeks and workouts"""
    program = db.query(TrainingProgram).filter(
        TrainingProgram.id == program_id
    ).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    return program


@router.put("/workout/{workout_id}/complete")
async def mark_workout_complete(workout_id: int, db: Session = Depends(get_db)):
    """Mark a workout as completed"""
    workout = db.query(ProgramWorkout).filter(
        ProgramWorkout.id == workout_id
    ).first()
    
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    workout.completed = not workout.completed
    workout.completed_at = datetime.utcnow() if workout.completed else None
    db.commit()
    
    return {"success": True, "workout_id": workout_id, "completed": workout.completed}

@router.put("/week/{week_id}/regenerate")
async def regenerate_week(
    week_id: int, 
    request: RegenerateWeekRequest, 
    db: Session = Depends(get_db)
):
    """Regenerate a specific week based on user's adjustment request"""
    
    # Get the week and its program
    week = db.query(ProgramWeek).filter(ProgramWeek.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    
    program = db.query(TrainingProgram).filter(TrainingProgram.id == week.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        from openai import OpenAI
        import os
        import json
        import re
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Get current week info
        current_workouts = "\n".join([
            f"Day {w.day_number}: {w.workout_type} - {w.description[:50]}..." 
            for w in week.workouts
        ])
        
        system_prompt = """You are a fitness coach adjusting a training program week.
        
Return ONLY a JSON object with this structure:
{
  "weekly_goal": "Updated goal for the week",
  "workouts": [
    {
      "day_number": 1,
      "workout_type": "Run|Cycle|Swim|Strength|Rest",
      "description": "Detailed workout description",
      "duration_minutes": 45,
      "intensity": "Easy|Moderate|Hard"
    }
  ]
}

Be specific and detailed. Return ONLY valid JSON."""

        user_prompt = f"""Adjust Week {week.week_number} of the {program.title}.

Current week goal: {week.weekly_goal}
Current workouts:
{current_workouts}

Adjustment requested: {request.adjustment_request}

Program context:
- Overall goal: {program.goal}
- Week {week.week_number} of {program.duration_weeks}

Make the requested adjustments while maintaining good training principles."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        
        # Clean JSON
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'^```\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        
        week_data = json.loads(content)
        
        # Delete old workouts
        for workout in week.workouts:
            db.delete(workout)
        
        # Update week goal
        week.weekly_goal = week_data.get("weekly_goal", week.weekly_goal)
        
        # Create new workouts
        for workout_data in week_data["workouts"]:
            workout = ProgramWorkout(
                week_id=week.id,
                day_number=workout_data["day_number"],
                workout_type=workout_data["workout_type"],
                description=workout_data.get("description", ""),
                duration_minutes=workout_data.get("duration_minutes"),
                intensity=workout_data.get("intensity", "Moderate"),
                completed=False
            )
            db.add(workout)
        
        db.commit()
        db.refresh(week)
        
        return {"success": True, "message": "Week regenerated successfully"}
        
    except Exception as e:
        db.rollback()
        import traceback
        print("Error regenerating week:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error regenerating week: {str(e)}")


@router.delete("/{program_id}")
async def delete_program(program_id: int, db: Session = Depends(get_db)):
    """Delete a training program"""
    program = db.query(TrainingProgram).filter(
        TrainingProgram.id == program_id
    ).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    db.delete(program)
    db.commit()
    
    return {"success": True, "message": "Program deleted"}