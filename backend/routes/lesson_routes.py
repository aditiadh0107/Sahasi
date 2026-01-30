"""
Self-defense lesson routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
from database import get_db_connection

router = APIRouter()

@router.get("/lessons/{user_id}")
async def get_lessons(user_id: str):
    """Get self-defense lessons for user based on their BMI category"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Get user's BMI category
        cur.execute("SELECT bmi_category FROM users WHERE user_id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        category = user['bmi_category']

        # Get lessons for this category
        cur.execute("""
            SELECT lesson_id, title, description, difficulty, duration_minutes,
                   animation_url, video_url, thumbnail_url
            FROM lessons
            WHERE bmi_category = %s
            ORDER BY difficulty, title
        """, (category,))

        lessons = cur.fetchall()
        return lessons
    finally:
        cur.close()
        conn.close()
