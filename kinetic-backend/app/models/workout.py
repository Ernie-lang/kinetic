from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strava_id = Column(BigInteger, unique=True, index=True)
    name = Column(String)
    type = Column(String)  # Run, Ride, Swim, etc.
    start_date = Column(DateTime, index=True)

    # Basic metrics
    distance = Column(Float)  # meters
    moving_time = Column(Integer)  # seconds
    elapsed_time = Column(Integer)  # seconds
    total_elevation_gain = Column(Float)  # meters

    # Speed
    average_speed = Column(Float)  # m/s
    max_speed = Column(Float)  # m/s

    # Heart rate
    average_heartrate = Column(Float, nullable=True)
    max_heartrate = Column(Float, nullable=True)

    # Training Load
    suffer_score = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to user
    user = relationship("User", back_populates="workouts")