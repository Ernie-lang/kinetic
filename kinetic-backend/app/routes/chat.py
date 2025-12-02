from email import message
from secrets import token_urlsafe
from sys import prefix
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, datetime, timedelta
from openai import OpenAI
import os

from app.database.base import get_db
from app.models.chat import ChatMessage, DailyUsage
from app.models.user import User
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/api/chat", tags=["chat"])

#Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Rate limiting constants
MAX_DAILY_MESSAGES = 30
MAX_TOKENS_PER_RESPONSE = 500
CONVERSATION_HISTORY_LIMIT = 10

class ChatRequest(BaseModel):
    user_id: int
    message: str

class ChatResponse(BaseModel):
    response: str
    tokens_used: int
    remaining_messages: int

def check_rate_limit(db: Session, user_id: int) -> int:
    """Check if user has exceeded daily message limit. Returns remaining messages."""
    today = datetime.utcnow().date()

    usage = db.query(DailyUsage).filter(
        DailyUsage.user_id == user_id,
        DailyUsage.date >= datetime.combine(today, datetime.min.time())
    ).first()

    if not usage:
        # Create new usage record for today
        usage = DailyUsage(
            user_id=user_id,
            date=datetime.utcnow(),
            message_count=0,
            total_tokens=0
        )
        db.add(usage)
        db.commit()
        return MAX_DAILY_MESSAGES

    remaining = MAX_DAILY_MESSAGES - usage.message_count
    if remaining <= 0:
        raise HTTPException(
            status_code=492,
            detail=f"Daily message limit reached. Limit resets at midnight UTC. You can send {MAX_DAILY_MESSAGES} messages per day."
        )

    return remaining

def get_conversation_history(db: Session, user_id: int) -> list:
    """Get recent conversation history for context"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at.desc()).limit(CONVERSATION_HISTORY_LIMIT).all()

    # Reverse to get chronological order
    messages = list(reversed(messages))

    return [{"role": msg.role, "content": msg.content} for msg in messages]

def update_usage(db: Session, user_id: int, tokens: int):
    """Update daily usage statistics"""
    today = datetime.utcnow().date()

    usage = db.query(DailyUsage).filter(
        DailyUsage.user_id == user_id,
        DailyUsage.date >= datetime.combine(today, datetime.min.time())
    ).first()

    if usage:
        usage.message_count += 1
        usage.total_tokens += tokens
        db.commit()

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest, db: Session = Depends(get_db)):
    """Send a message to the AI coach and get a response"""

    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check rate limit
    remaining = check_rate_limit(db, request.user_id)

    # Get workout context for AI
    workout_context = AnalyticsService.get_workout_context(db, request.user_id, limit=10)
    weekly_summary = AnalyticsService.get_weekly_summary(db, request.user_id)

    # Build system prompt
    system_prompt = f"""You are an expert fitness coach helping {user.first_name} with their training
    
Conext about {user.first_name}'s recent training:
{workout_context}

Weekly summary:
- Total workouts this week: {weekly_summary['total_workouts']}
- Total distance: {weekly_summary['total_distance_km']}km
- Total time: {weekly_summary['total_time_hours']}hrs
- Activities: {weekly_summary['activity_breakdown']}

Guidlines:
- Focus on fitness, training, recovery, and performance topics
- Be supportive, motivating, and specific
- Reference their actual workout data when relevant
- Keep responses concise (under 200 words)
- If asked about non-fitness topics, politely redirect: "I'm here to help with your training. For other topics try ChatGPT!"
"""

    # Get conversation history
    history = get_conversation_history(db, request.user_id)

    # Build messages for OpenAI
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": request.message})

    try:
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=MAX_TOKENS_PER_RESPONSE,
            temperature=0.7
        )

        assistant_message = response.choices[0].message.content
        tokens_used = response.usage.total_tokens

        # Save user message
        user_msg = ChatMessage(
            user_id=request.user_id,
            role="user",
            content=request.message,
            tokens_used=0
        )
        db.add(user_msg)

        # Save assistant response
        assistant_msg = ChatMessage(
            user_id=request.user_id,
            role="assistant",
            content=assistant_message,
            tokens_used=tokens_used
        )
        db.add(assistant_msg)

        # Update usage stats
        update_usage(db, request.user_id, tokens_used)

        db.commit()

        return ChatResponse(
            response=assistant_message,
            tokens_used=tokens_used,
            remaining_messages=remaining - 1
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error communicating with AI: {str(e)}")

@router.get("/history/{user_id}")
async def get_chat_history(user_id: int, db: Session = Depends(get_db)):
    """Get chat history for a user"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at.asc()).all()

    return {
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }

@router.get("/usage/{user_id}")
async def get_usage_stats(user_id: int, db: Session = Depends(get_db)):
    """Get usage statistics for a user"""
    today = datetime.utcnow().date()

    usage = db.query(DailyUsage).filter(
        DailyUsage.user_id == user_id,
        DailyUsage.date >= datetime.combine(today, datetime.min.time())
    ).first()

    if not usage:
        return {
            "messages_used": 0,
            "messages_remaining": MAX_DAILY_MESSAGES,
            "tokens_used_today": 0
        }

    return {
        "messages_used": usage.message_count,
        "messages_remaining": MAX_DAILY_MESSAGES - usage.message_count,
        "tokens_used_today": usage.total_tokens
    }