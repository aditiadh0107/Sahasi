# incident reporting routes - users can submit harassment reports
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import httpx
from database import get_db_connection

# middleware url for real-time police alerts
MIDDLEWARE_URL = "http://localhost:3000"

router = APIRouter()

class HarassmentReportCreate(BaseModel):
    title: str
    description: str
    incident_type: str  # harassment, stalking, assault, verbal_abuse, etc
    severity: str  # low, medium, high, critical
    location: Optional[str] = None
    date_time: Optional[str] = None
    suspect_description: Optional[str] = None
    phone_number: Optional[str] = None
    witness_available: bool = False
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class IncidentStatusUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_to: Optional[str] = None

@router.post("/incidents")
async def create_harassment_report(report: HarassmentReportCreate, user_id: str = Query(...)):
    # basic validation
    if not report.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    if len(report.description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Description must be at least 10 characters")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # store all form fields as JSON so police web can parse them reliably
        import json
        full_desc = json.dumps({
            "title": report.title,
            "description": report.description,
            "incident_type": report.incident_type,
            "severity": report.severity,
            "location": report.location or "",
            "date_time": report.date_time or "",
            "suspect_description": report.suspect_description or "",
            "witness_available": report.witness_available,
            "phone_number": report.phone_number or "",
        })

        cur.execute("""
            INSERT INTO incident_reports (user_id, description, image_data,
                                         latitude, longitude, status, reported_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING report_id, reported_at
        """, (
            user_id,
            full_desc,
            report.image_base64 or report.image_url,
            0.0,
            0.0,
            'submitted'
        ))

        result = cur.fetchone()
        conn.commit()

        # notify police portal via middleware
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{MIDDLEWARE_URL}/trigger/incident",
                    json={
                        "reportId": str(result['report_id']),
                        "userId": user_id,
                        "latitude": 0.0,
                        "longitude": 0.0
                    }
                )
        except Exception as e:
            print(f"Warning: could not notify police middleware: {e}")
            # don't fail the report if middleware is down

        return {
            "id": str(result['report_id']),
            "user_id": user_id,
            "title": report.title,
            "description": report.description,
            "incident_type": report.incident_type,
            "severity": report.severity,
            "location": report.location,
            "date_time": report.date_time,
            "suspect_description": report.suspect_description,
            "witness_available": report.witness_available,
            "image_url": report.image_url,
            "image_base64": report.image_base64,
            "status": "submitted",
            "created_at": result['reported_at'],
            "updated_at": result['reported_at']
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/incidents")
async def get_harassment_reports(user_id: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # build query with optional filters
        query = "SELECT * FROM incident_reports WHERE 1=1"
        params = []

        if user_id:
            query += " AND user_id = %s"
            params.append(user_id)

        if status:
            query += " AND status = %s"
            params.append(status)

        query += " ORDER BY reported_at DESC"

        cur.execute(query, params)
        reports = cur.fetchall()

        # parse JSON description and surface fields as top-level keys
        import json
        result = []
        for r in reports:
            row = dict(r)
            try:
                d = json.loads(row.get('description', '{}'))
                row['title'] = d.get('title', '')
                row['incident_type'] = d.get('incident_type', '')
                row['severity'] = d.get('severity', '')
                row['location_text'] = d.get('location', '')
                row['date_time'] = d.get('date_time', '')
                row['suspect_description'] = d.get('suspect_description', '')
                row['witness_available'] = d.get('witness_available', False)
                row['phone_number'] = d.get('phone_number', '')
                row['incident_description'] = d.get('description', '')
            except Exception:
                row['title'] = ''
                row['incident_type'] = ''
                row['severity'] = ''
                row['location_text'] = ''
                row['date_time'] = ''
                row['suspect_description'] = ''
                row['witness_available'] = False
                row['phone_number'] = ''
                row['incident_description'] = row.get('description', '')
            result.append(row)
        return result
    finally:
        cur.close()
        conn.close()

@router.get("/incidents/{report_id}")
async def get_harassment_report(report_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM incident_reports WHERE report_id = %s", (report_id,))
        report = cur.fetchone()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    finally:
        cur.close()
        conn.close()

@router.put("/incidents/{report_id}")
async def update_harassment_report(report_id: str, update_data: IncidentStatusUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # build update query dynamically
        updates = []
        params = []

        if update_data.status:
            updates.append("status = %s")
            params.append(update_data.status)

        if update_data.resolution_notes:
            updates.append("reviewed_at = CURRENT_TIMESTAMP")

        if update_data.assigned_to:
            updates.append("reviewed_by = %s")
            params.append(update_data.assigned_to)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(report_id)
        query = f"UPDATE incident_reports SET {', '.join(updates)} WHERE report_id = %s RETURNING *"

        cur.execute(query, params)
        result = cur.fetchone()
        conn.commit()

        if not result:
            raise HTTPException(status_code=404, detail="Report not found")

        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
