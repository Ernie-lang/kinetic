from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)

    # Profile info
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)

    # Strava integration
    strava_id = Column(String, unique=True, index=True)
    strava_access_token = Column(String)
    strava_refresh_token = Column(String)
    strava_token_expires_at = Column(DateTime, nullable=True)
    strava_athlete_id = Column(Integer, nullable=True, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")