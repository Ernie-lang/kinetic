from ast import In
from email.policy import default
from textwrap import indent
from tkinter import CASCADE
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class TrainingProgram(Base):
    __tablename__ = "training_programs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    goal = Column(String(500))
    duration_weeks = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="training_programs")
    weeks = relationship("ProgramWeek", back_populates="program", cascade="all, delete-orphan")

class ProgramWeek(Base):
    __tablename__ = "program_weeks"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("training_programs.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    weekly_goal = Column(String(200))

    program = relationship("TrainingProgram", back_populates="weeks")
    workouts = relationship("ProgramWorkout", back_populates="week", cascade="all, delete-orphan")

class ProgramWorkout(Base):
    __tablename__ = "program_workouts"

    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey("program_weeks.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    workout_type = Column(String(50), nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer)
    intensity = Column(String(20))
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)

    week = relationship("ProgramWeek", back_populates="workouts")