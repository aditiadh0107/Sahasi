# profile routes - create profile without full registration
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from database import get_db_connection

router = APIRouter()

class ProfileCreate(BaseModel):
    name: str
    age: int
    height: float  # in cm
    weight: float  # in kg

@router.post("/profiles")
async def create_profile(profile: ProfileCreate):
    # basic validation
    if profile.age < 10 or profile.age > 100:
        raise HTTPException(status_code=400, detail="Invalid age")
    if profile.height < 100 or profile.height > 250:
        raise HTTPException(status_code=400, detail="Invalid height")
    if profile.weight < 30 or profile.weight > 300:
        raise HTTPException(status_code=400, detail="Invalid weight")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        profile_id = str(uuid.uuid4())
        height_m = profile.height / 100  # convert to meters for db

        # placeholder email/phone since db requires them
        placeholder_email = f"user_{profile_id[:8]}@placeholder.local"
        placeholder_phone = f"+1{profile_id[:8].replace('-', '')[:10]}"

        cur.execute("""
            INSERT INTO users (user_id, name, email, phone, password_hash, age, height, weight)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING user_id, bmi, bmi_category, created_at
        """, (profile_id, profile.name, placeholder_email, placeholder_phone,
              "placeholder_hash", profile.age, height_m, profile.weight))

        result = cur.fetchone()
        conn.commit()

        return {
            "id": result['user_id'],
            "name": profile.name,
            "age": profile.age,
            "height": profile.height,
            "weight": profile.weight,
            "bmi": round(float(result['bmi']), 1),
            "category": f"CATEGORY_{result['bmi_category']}",
            "created_at": result['created_at']
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/profiles/{profile_id}")
async def get_profile(profile_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT user_id, name, age, height, weight, bmi, bmi_category, created_at
            FROM users WHERE user_id = %s
        """, (profile_id,))

        profile = cur.fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {
            "id": profile['user_id'],
            "name": profile['name'],
            "age": profile['age'],
            "height": profile['height'] * 100,  # convert back to cm
            "weight": profile['weight'],
            "bmi": round(float(profile['bmi']), 1),
            "category": profile['bmi_category']
        }
    finally:
        cur.close()
        conn.close()
