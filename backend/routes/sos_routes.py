# SOS alert routes - trigger SOS and notify trusted contacts
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import httpx
from database import get_db_connection

# middleware url for real-time alerts
MIDDLEWARE_URL = "http://localhost:3000"

router = APIRouter()

class SOSRequest(BaseModel):
    latitude: float
    longitude: float

@router.post("/sos/{user_id}")
async def create_sos_alert(user_id: str, sos: SOSRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # save the SOS alert to db
        cur.execute("""
            INSERT INTO sos_alerts (user_id, latitude, longitude, status)
            VALUES (%s, %s, %s, 'active')
            RETURNING alert_id, triggered_at
        """, (user_id, sos.latitude, sos.longitude))

        result = cur.fetchone()
        alert_id = result['alert_id']

        # get all trusted contacts for this user
        cur.execute("""
            SELECT u.user_id, u.name, u.email, u.phone
            FROM trusted_contact_links tcl
            JOIN users u ON tcl.trusted_contact_id = u.user_id
            WHERE tcl.user_id = %s
        """, (user_id,))
        contacts = cur.fetchall()

        # log notification for each contact
        for contact in contacts:
            cur.execute("""
                INSERT INTO notification_logs (recipient_id, recipient_type, notification_type, notification_data)
                VALUES (%s, 'user', 'sos_alert', %s)
            """, (contact['user_id'], json.dumps({
                "alertId": str(alert_id),
                "fromUserId": user_id,
                "latitude": sos.latitude,
                "longitude": sos.longitude,
                "triggeredAt": result['triggered_at'].isoformat() if result['triggered_at'] else None
            })))

        conn.commit()

        # send real-time alert to middleware (websockets)
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{MIDDLEWARE_URL}/trigger/sos",
                    json={
                        "alertId": str(alert_id),
                        "userId": user_id,
                        "latitude": sos.latitude,
                        "longitude": sos.longitude,
                        "trustedContacts": [contact['user_id'] for contact in contacts],
                        "triggeredAt": result['triggered_at'].isoformat() if result['triggered_at'] else None
                    }
                )
        except Exception as e:
            print(f"Warning: could not notify middleware about SOS: {e}")
            # don't fail the SOS if middleware is down

        return {
            "alert_id": alert_id,
            "user_id": user_id,
            "triggered_at": result['triggered_at'],
            "notified_contacts": len(contacts)
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/sos/alerts/{user_id}")
async def get_user_sos_alerts(user_id: str):
    # special case: if 'all' or 'police_portal', return all active alerts
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if user_id in ['all', 'police_portal']:
            cur.execute("""
                SELECT sa.alert_id, sa.user_id, u.name,
                       sa.latitude, sa.longitude, sa.status, sa.triggered_at
                FROM sos_alerts sa
                JOIN users u ON sa.user_id = u.user_id
                WHERE sa.status = 'active'
                ORDER BY sa.triggered_at DESC
            """)
        else:
            # get alerts for user or from their trusted contacts
            cur.execute("""
                SELECT sa.alert_id, sa.user_id, u.name,
                       sa.latitude, sa.longitude, sa.status, sa.triggered_at
                FROM sos_alerts sa
                JOIN users u ON sa.user_id = u.user_id
                WHERE sa.user_id = %s OR sa.user_id IN (
                    SELECT trusted_contact_id FROM trusted_contact_links WHERE user_id = %s
                )
                ORDER BY sa.triggered_at DESC
            """, (user_id, user_id))

        alerts = cur.fetchall()
        return alerts
    finally:
        cur.close()
        conn.close()

@router.put("/sos/alerts/{alert_id}/resolve")
async def resolve_sos_alert(alert_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE sos_alerts
            SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
            WHERE alert_id = %s
        """, (alert_id,))
        conn.commit()
        return {"message": "SOS alert resolved"}
    finally:
        cur.close()
        conn.close()
