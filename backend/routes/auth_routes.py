# auth routes - user and therapist register/login
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib
import secrets
import uuid
from database import get_db_connection

router = APIRouter()

# hash the password with a salt
def hash_password(password):
    salt = secrets.token_hex(16)
    return hashlib.sha256((password + salt).encode()).hexdigest() + ':' + salt

# check if password matches the stored hash
def verify_password(password, hashed):
    try:
        password_hash, salt = hashed.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
    except:
        return False

class UserCreate(BaseModel):
    name: str
    email: str
    age: int
    height: float  # in cm
    weight: float  # in kg
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/users/register")
async def register_user(user: UserCreate):
    # basic validation
    if len(user.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name too short")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if user.age < 13 or user.age > 120:
        raise HTTPException(status_code=400, detail="Invalid age")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # check if email already used
        cur.execute("SELECT user_id FROM users WHERE email = %s", (user.email.lower(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="User with this email already exists")

        password_hash = hash_password(user.password)
        height_m = user.height / 100  # convert cm to meters for db

        # generate placeholder phone since db requires it
        placeholder_phone = f"+1{str(uuid.uuid4())[:8].replace('-', '')}"

        cur.execute("""
            INSERT INTO users (name, email, phone, password_hash, age, height, weight)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING user_id, bmi, bmi_category, created_at
        """, (user.name, user.email.lower(), placeholder_phone, password_hash, user.age, height_m, user.weight))

        result = cur.fetchone()
        conn.commit()

        return {
            "user_id": result['user_id'],
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "height": user.height,
            "weight": user.weight,
            "bmi": round(float(result['bmi']), 1),
            "category": f"CATEGORY_{result['bmi_category']}",
            "created_at": result['created_at'],
            "message": "Registration successful"
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print("register error:", e)
        if "duplicate key value" in str(e) and "email" in str(e):
            raise HTTPException(status_code=400, detail="User with this email already exists")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")
    finally:
        cur.close()
        conn.close()

@router.post("/users/login")
async def login_user(credentials: UserLogin):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT user_id, name, email, age, height, weight, bmi, bmi_category, password_hash, is_active
            FROM users WHERE email = %s
        """, (credentials.email.lower(),))

        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user['is_active']:
            raise HTTPException(status_code=401, detail="Account is deactivated")

        # check password
        if not verify_password(credentials.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # update last login time
        cur.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = %s", (user['user_id'],))
        conn.commit()

        return {
            "user_id": user['user_id'],
            "name": user['name'],
            "email": user['email'],
            "age": user['age'],
            "height": user['height'] * 100,  # convert back to cm
            "weight": user['weight'],
            "bmi": round(float(user['bmi']), 1),
            "category": f"CATEGORY_{user['bmi_category']}",
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        print("login error:", e)
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")
    finally:
        cur.close()
        conn.close()

@router.post("/therapists/login")
async def login_therapist(email: str, password: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT therapist_id, name, email, qualification, specialization,
                   experience_years, is_verified, is_active
            FROM therapists WHERE email = %s AND password_hash = %s
        """, (email, password))

        therapist = cur.fetchone()
        if not therapist or not therapist['is_active']:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return dict(therapist)
    finally:
        cur.close()
        conn.close()

@router.get("/users")
async def get_all_users():
    # for admin dashboard
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT user_id, name, email, phone, age, created_at
            FROM users ORDER BY created_at DESC
        """)
        users = cur.fetchall()
        return users
    finally:
        cur.close()
        conn.close()

@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")

        cur.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        conn.commit()
        return {"message": f"User {user_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete user")
    finally:
        cur.close()
        conn.close()
