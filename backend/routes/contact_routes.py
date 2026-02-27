# trusted contact routes - connect users with trusted people using a 6-digit code
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from utils.code_generator import generate_unique_six_digit_code

router = APIRouter()

class VerifyCodeRequest(BaseModel):
    code: str

@router.post("/contacts/generate-code/{user_id}")
async def generate_connection_code(user_id: str):
    # generate a 6-digit code for this user to share
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        code = generate_unique_six_digit_code()

        # store code as pending connection
        cur.execute("""
            INSERT INTO trusted_contacts (user_id_1, connection_code, status)
            VALUES (%s, %s, 'pending')
            RETURNING connection_id
        """, (user_id, code))

        result = cur.fetchone()
        conn.commit()

        return {"code": code, "connection_id": result['connection_id']}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/contacts/verify-code/{user_id}")
async def verify_connection_code(user_id: str, request: VerifyCodeRequest):
    # user enters someone else's code to connect with them
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # find the pending connection with this code
        cur.execute("""
            SELECT connection_id, user_id_1
            FROM trusted_contacts
            WHERE connection_code = %s AND status = 'pending'
        """, (request.code,))

        connection = cur.fetchone()
        if not connection:
            raise HTTPException(status_code=404, detail="Invalid code")

        # mark as connected
        cur.execute("""
            UPDATE trusted_contacts
            SET user_id_2 = %s, status = 'connected', connected_at = CURRENT_TIMESTAMP
            WHERE connection_id = %s
        """, (user_id, connection['connection_id']))

        # create bidirectional links so both users see each other as trusted contacts
        cur.execute("""
            INSERT INTO trusted_contact_links (user_id, trusted_contact_id)
            VALUES (%s, %s), (%s, %s)
        """, (connection['user_id_1'], user_id, user_id, connection['user_id_1']))

        conn.commit()
        return {"message": "Connection established", "connection_id": connection['connection_id']}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/contacts/{user_id}")
async def get_trusted_contacts(user_id: str):
    # get all trusted contacts for this user
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT tcl.user_id, tcl.trusted_contact_id, tcl.connection_date,
                   u.name, u.email, u.phone
            FROM trusted_contact_links tcl
            LEFT JOIN users u ON tcl.trusted_contact_id = u.user_id
            WHERE tcl.user_id = %s
        """, (user_id,))
        contacts = cur.fetchall()
        return contacts
    finally:
        cur.close()
        conn.close()
