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
    type = Column(String)  # Run, Ride, Swim
    start_date = Column(DateTime, index=True)

    distance = Column(Float)  # meters
    moving_time = Column(Integer)  # seconds
    elapsed_time = Column(Integer)  # seconds
    total_elevation_gain = Column(Float)  # meters

    average_speed = Column(Float)
    max_speed = Column(Float)

    average_heartrate = Column(Float, nullable=True)
    max_heartrate = Column(Float, nullable=True)

    suffer_score = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="workouts")