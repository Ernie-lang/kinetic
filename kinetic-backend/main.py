from sys import prefix
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.base import engine, Base
from app.models.user import User
from app.models.workout import Workout
from app.models.chat import ChatMessage, DailyUsage
from app.models.program import TrainingProgram, ProgramWeek, ProgramWorkout
from app.routes import strava, workouts, chat, analytics, programs, sport_analytics, auth

#Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kinetic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React app's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

app.include_router(strava.router)
app.include_router(workouts.router, prefix="/api", tags=["workouts"])
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(programs.router)
app.include_router(sport_analytics.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Kinetic API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}