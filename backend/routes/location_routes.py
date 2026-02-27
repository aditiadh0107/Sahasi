# location and zone routes - safe/unsafe zones for the map
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db_connection

router = APIRouter()

class ZoneCreate(BaseModel):
    type: str  # 'safe' or 'unsafe'
    latitude: float
    longitude: float
    name: str
    description: Optional[str] = ""

@router.post("/zones/{user_id}")
async def create_zone(user_id: str, zone: ZoneCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO zones (user_id, zone_type, zone_name, latitude, longitude, radius)
            VALUES (%s, %s, %s, %s, %s, 1000)
            RETURNING zone_id, created_at
        """, (user_id, zone.type, zone.name, zone.latitude, zone.longitude))

        result = cur.fetchone()
        conn.commit()

        return {
            "zone_id": result['zone_id'],
            "user_id": user_id,
            "type": zone.type,
            "name": zone.name,
            "latitude": zone.latitude,
            "longitude": zone.longitude,
            "radius": 1000,
            "created_at": result['created_at']
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/zones/{user_id}")
async def get_zones(user_id: str):
    # get all zones for this user
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT zone_id, zone_type, zone_name, latitude, longitude, radius, created_at
            FROM zones WHERE user_id = %s
        """, (user_id,))
        zones = cur.fetchall()
        return zones
    finally:
        cur.close()
        conn.close()

@router.delete("/zones/delete/{zone_id}")
async def delete_zone(zone_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM zones WHERE zone_id = %s", (zone_id,))
        conn.commit()
        return {"message": "Zone deleted successfully"}
    finally:
        cur.close()
        conn.close()
