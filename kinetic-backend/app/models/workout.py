from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strava_activity_id = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String)  # Run, Ride, Swim, etc.
    distance = Column(Float)  # meters
    duration = Column(Integer)  # seconds
    elevation_gain = Column(Float)  # meters
    average_speed = Column(Float)  # m/s
    max_speed = Column(Float)  # m/s
    average_heartrate = Column(Float)
    max_heartrate = Column(Float)
    start_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True))
    
    # Relationship to user
    user = relationship("User", backref="workouts")