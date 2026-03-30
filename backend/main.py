# main.py - Sahasi API entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import all route modules
from routes import (
    auth_routes,
    profile_routes,
    lesson_routes,
    location_routes,
    contact_routes,
    sos_routes,
    therapist_routes,
    incident_routes
)

app = FastAPI(title="Sahasi API", description="Women Safety App Backend", version="1.0.0")

# allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register all routers
app.include_router(auth_routes.router, prefix="/api", tags=["auth"])
app.include_router(profile_routes.router, prefix="/api", tags=["profiles"])
app.include_router(lesson_routes.router, prefix="/api", tags=["lessons"])
app.include_router(location_routes.router, prefix="/api", tags=["location"])
app.include_router(contact_routes.router, prefix="/api", tags=["contacts"])
app.include_router(sos_routes.router, prefix="/api", tags=["sos"])
app.include_router(therapist_routes.router, prefix="/api", tags=["therapist"])
app.include_router(incident_routes.router, prefix="/api", tags=["incident"])

@app.get("/")
async def root():
    return {"message": "Sahasi API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# debug endpoint - check how many incidents in db
@app.get("/debug/incidents-count")
async def debug_incidents_count():
    from database import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) as count FROM incident_reports")
        result = cur.fetchone()
        return {"incident_count": result['count'] if result else 0}
    except Exception as e:
        return {"error": str(e), "incident_count": 0}
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
