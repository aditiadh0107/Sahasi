# therapist routes - create therapists, handle chat requests and messages
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import hashlib
from database import get_db_connection

router = APIRouter()

class TherapistCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    qualification: str
    specialization: str
    experience_years: int
    license_number: str

@router.post("/therapists/create")
async def create_therapist(therapist: TherapistCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # check if email already exists
        cur.execute("SELECT email FROM therapists WHERE email = %s", (therapist.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        # check if license already exists
        cur.execute("SELECT license_number FROM therapists WHERE license_number = %s", (therapist.license_number,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="License number already registered")

        # hash password
        password_hash = hashlib.md5(therapist.password.encode()).hexdigest()

        cur.execute("""
            INSERT INTO therapists (
                name, email, password_hash, age, qualification,
                specialization, experience_years, license_number,
                is_verified, is_active, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE, CURRENT_TIMESTAMP)
            RETURNING therapist_id
        """, (
            therapist.name, therapist.email, password_hash, therapist.age,
            therapist.qualification, therapist.specialization,
            therapist.experience_years, therapist.license_number
        ))

        result = cur.fetchone()
        conn.commit()

        return {
            "therapist_id": result['therapist_id'],
            "message": "Therapist created successfully",
            "is_verified": True,
            "is_active": True
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating therapist: {str(e)}")
    finally:
        cur.close()
        conn.close()

@router.get("/therapists")
async def get_therapists():
    # get all active verified therapists
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT therapist_id, name, qualification, specialization, experience_years
            FROM therapists
            WHERE is_verified = TRUE AND is_active = TRUE
            ORDER BY name
        """)
        therapists = cur.fetchall()
        return therapists
    finally:
        cur.close()
        conn.close()

class ChatRequestCreate(BaseModel):
    user_id: str
    therapist_id: str

@router.post("/chat-requests")
async def create_chat_request(request: ChatRequestCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO chat_requests (user_id, therapist_id, status, requested_at)
            VALUES (%s, %s, 'pending', CURRENT_TIMESTAMP)
            RETURNING request_id
        """, (request.user_id, request.therapist_id))

        result = cur.fetchone()
        conn.commit()

        return {
            "request_id": result['request_id'],
            "status": "pending",
            "message": "Chat request sent to therapist"
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/chat-requests")
async def get_chat_requests(user_id: str = None, therapist_id: str = None):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if user_id:
            # get requests for a user
            cur.execute("""
                SELECT cr.request_id, cr.user_id, t.name as therapist_name, cr.therapist_id,
                       cr.status, cr.requested_at, cr.responded_at
                FROM chat_requests cr
                JOIN therapists t ON cr.therapist_id = t.therapist_id
                WHERE cr.user_id = %s
                ORDER BY cr.requested_at DESC
            """, (user_id,))
        elif therapist_id:
            # get requests for a therapist
            cur.execute("""
                SELECT cr.request_id, cr.user_id, u.name as user_name, cr.therapist_id,
                       cr.status, cr.requested_at, cr.responded_at
                FROM chat_requests cr
                JOIN users u ON cr.user_id = u.user_id
                WHERE cr.therapist_id = %s
                ORDER BY cr.requested_at DESC
            """, (therapist_id,))
        else:
            # return all requests
            cur.execute("""
                SELECT cr.request_id, cr.user_id, cr.therapist_id,
                       cr.status, cr.requested_at, cr.responded_at
                FROM chat_requests cr
                ORDER BY cr.requested_at DESC
            """)

        requests = cur.fetchall()
        return requests
    finally:
        cur.close()
        conn.close()

@router.get("/chat-requests/therapist/{therapist_id}")
async def get_therapist_requests(therapist_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if therapist_id == 'all':
            # special case - return all requests (for admin/therapist web)
            cur.execute("""
                SELECT cr.request_id, cr.user_id, u.name as user_name, cr.therapist_id,
                       t.name as therapist_name, cr.status, cr.requested_at, cr.responded_at
                FROM chat_requests cr
                JOIN users u ON cr.user_id = u.user_id
                LEFT JOIN therapists t ON cr.therapist_id = t.therapist_id
                ORDER BY cr.requested_at DESC
            """)
        else:
            cur.execute("""
                SELECT cr.request_id, cr.user_id, u.name as user_name, cr.status,
                       cr.requested_at, cr.responded_at
                FROM chat_requests cr
                JOIN users u ON cr.user_id = u.user_id
                WHERE cr.therapist_id = %s
                ORDER BY cr.requested_at DESC
            """, (therapist_id,))

        requests = cur.fetchall()
        return requests
    finally:
        cur.close()
        conn.close()

class ChatRequestResponse(BaseModel):
    status: str  # 'accepted' or 'rejected'

@router.put("/chat-requests/{request_id}")
async def respond_to_chat_request(request_id: str, response: ChatRequestResponse):
    if response.status not in ['accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'rejected'")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE chat_requests
            SET status = %s, responded_at = CURRENT_TIMESTAMP
            WHERE request_id = %s
            RETURNING request_id, user_id, therapist_id
        """, (response.status, request_id))

        result = cur.fetchone()
        conn.commit()

        return {
            "request_id": result['request_id'],
            "status": response.status,
            "message": f"Chat request {response.status}"
        }
    finally:
        cur.close()
        conn.close()

class MessageCreate(BaseModel):
    request_id: str
    sender_id: str
    sender_type: str  # 'user' or 'therapist'
    message_text: str

@router.post("/messages")
async def send_message(message: MessageCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO messages (chat_request_id, sender_id, sender_type, message_text, sent_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING message_id, sent_at
        """, (message.request_id, message.sender_id, message.sender_type, message.message_text))

        result = cur.fetchone()
        conn.commit()

        return {"message_id": result['message_id'], "sent_at": result['sent_at']}
    finally:
        cur.close()
        conn.close()

@router.get("/chat-requests/{request_id}/messages")
async def get_chat_messages(request_id: str):
    # get all messages for a chat (used by mobile app)
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT message_id, sender_id, sender_type, message_text, sent_at, chat_request_id
            FROM messages
            WHERE chat_request_id = %s
            ORDER BY sent_at ASC
        """, (request_id,))
        messages = cur.fetchall()
        return messages
    finally:
        cur.close()
        conn.close()

@router.get("/messages/{request_id}")
async def get_messages(request_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT message_id, sender_id, sender_type, message_text, sent_at
            FROM messages
            WHERE chat_request_id = %s
            ORDER BY sent_at ASC
        """, (request_id,))
        messages = cur.fetchall()
        return messages
    finally:
        cur.close()
        conn.close()

@router.get("/accepted-chats/therapist/{therapist_id}")
async def get_accepted_chats(therapist_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT cr.request_id, cr.user_id, u.name as user_name, cr.status,
                   cr.requested_at, cr.responded_at
            FROM chat_requests cr
            JOIN users u ON cr.user_id = u.user_id
            WHERE cr.therapist_id = %s AND cr.status = 'accepted'
            ORDER BY cr.responded_at DESC
        """, (therapist_id,))
        chats = cur.fetchall()
        return chats
    finally:
        cur.close()
        conn.close()
