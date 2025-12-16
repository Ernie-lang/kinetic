from openai import OpenAI
import os
import json
import re
from sqlalchemy.orm import Session

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ProgramGenerator:
    @staticmethod
    def generate_program(user_name: str, goal: str, fitness_level: str, days_per_week: int, duration_weeks: int, db: Session = None, user_id: int = None) -> dict:
        """Generate a training program using OpenAI"""

        # Get workout context if database session provided
        workout_context = ""
        if db and user_id:
            from app.services.analytics import AnalyticsService
            workout_data = AnalyticsService.get_workout_context(db, user_id, limit=20)
            weekly_summary = AnalyticsService.get_weekly_summary(db, user_id)
            
            workout_context = f"""
Recent Training History:
{workout_data}

Recent Performance:
- Total workouts this week: {weekly_summary['total_workouts']}
- Total distance: {weekly_summary['total_distance_km']}km
- Total time: {weekly_summary['total_time_hours']}hrs
- Activities: {weekly_summary['activity_breakdown']}
"""

        system_prompt = """You are an expert fitness coach creating personalized training programs.

Create a structured training program in JSON format with this exact structure:
{
  "title": "Program title",
  "description": "Brief description",
  "weeks": [
    {
      "week_number": 1,
      "weekly_goal": "Goal for this week",
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
  ]
}

Guidelines:
- Be specific and detailed in workout descriptions
- Include proper warmup/cooldown instructions
- Progress difficulty appropriately through weeks
- Include rest days
- Workout types: Run, Cycle, Swim, Strength, Rest
- Intensity levels: Easy, Moderate, Hard
- IMPORTANT: Use the athlete's recent training history to create realistic, progressive workouts
- Build on their current fitness level shown in recent workouts
"""

        user_prompt = f"""Create a {duration_weeks}-week training program for {user_name}.

Goal: {goal}
Fitness Level: {fitness_level}
Training Days per Week: {days_per_week}

{workout_context}

Based on their recent training, create a program that:
1. Builds progressively from their current fitness level
2. Addresses their specific goal
3. Is realistic given their recent workout patterns
4. Balances intensity with recovery

Make it personalized, progressive, and achievable. Return ONLY valid JSON, no additional text."""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=8000
            )
            
            content = response.choices[0].message.content.strip()

            # Remove markdown code blocks if present
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            content = content.strip()

            # Try to extract JSON if there's extra text
            if not content.startswith('{'):
                # Find first { and last }
                start = content.find('{')
                end = content.rfind('}')
                if start != -1 and end != -1:
                    content = content[start:end+1]

            # Print content for debugging
            print("AI Response length:", len(content))
            print("First 200 chars:", content[:200])
            print("Last 200 chars:", content[-200:])
            
            program_data = json.loads(content)
            return program_data
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Error generating program: {str(e)}")