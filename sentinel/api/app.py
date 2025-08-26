"""FastAPI application for Sentinel One Lite."""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from sentinel.storage.db import get_db, create_tables
from sentinel.storage.models import Host, Event, Rule, Alert, RuleMatch

# Create FastAPI app
app = FastAPI(
    title="Sentinel One Lite",
    description="Lightweight host security monitoring system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for the web UI
app.mount("/static", StaticFiles(directory="sentinel/api/static"), name="static")

# Ensure database tables exist
@app.on_event("startup")
async def startup_event():
    create_tables()

# Root endpoint - serve the main web UI
@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main web UI."""
    with open("sentinel/api/static/index.html", "r") as f:
        return HTMLResponse(content=f.read())

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Sentinel One Lite"}

# Dashboard statistics
@app.get("/api/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    try:
        total_hosts = db.query(Host).count()
        total_events = db.query(Event).count()
        total_rules = db.query(Rule).count()
        total_alerts = db.query(Alert).count()
        
        # Recent events (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.now() - timedelta(days=1)
        recent_events = db.query(Event).filter(Event.event_time >= yesterday).count()
        
        # High severity alerts
        high_alerts = db.query(Alert).filter(Alert.severity == "high").count()
        
        return {
            "total_hosts": total_hosts,
            "total_events": total_events,
            "total_rules": total_rules,
            "total_alerts": total_alerts,
            "recent_events": recent_events,
            "high_alerts": high_alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Host management endpoints
@app.get("/api/hosts")
async def get_hosts(db: Session = Depends(get_db)):
    """Get all hosts."""
    try:
        hosts = db.query(Host).all()
        return [{"id": h.id, "hostname": h.hostname, "platform": h.platform, "os_version": h.os_version, "last_seen": h.last_seen, "created_at": h.created_at} for h in hosts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hosts")
async def create_host(host_data: dict, db: Session = Depends(get_db)):
    """Create a new host."""
    try:
        from datetime import datetime
        host = Host(
            hostname=host_data["hostname"],
            platform=host_data["platform"],
            os_version=host_data.get("os_version"),
            last_seen=datetime.now()
        )
        db.add(host)
        db.commit()
        db.refresh(host)
        return {"id": host.id, "hostname": host.hostname, "platform": host.platform, "os_version": host.os_version, "last_seen": host.last_seen, "created_at": host.created_at}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Event management endpoints
@app.get("/api/events")
async def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    host_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get events with filtering and pagination."""
    try:
        query = db.query(Event)
        
        if event_type:
            query = query.filter(Event.event_type == event_type)
        if severity:
            query = query.filter(Event.severity == severity)
        if host_id:
            query = query.filter(Event.host_id == host_id)
        
        events = query.offset(skip).limit(limit).all()
        return [{"id": e.id, "host_id": e.host_id, "event_type": e.event_type, "severity": e.severity, "event_time": e.event_time, "proc_name": e.proc_name, "proc_pid": e.proc_pid, "file_path": e.file_path, "net_raddr": e.net_raddr, "net_rport": e.net_rport} for e in events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Rule management endpoints
@app.get("/api/rules")
async def get_rules(db: Session = Depends(get_db)):
    """Get all rules."""
    try:
        rules = db.query(Rule).all()
        return [{"id": r.id, "name": r.name, "version": r.version, "enabled": r.enabled, "definition": r.definition, "created_at": r.created_at, "updated_at": r.updated_at} for r in rules]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rules")
async def create_rule(rule_data: dict, db: Session = Depends(get_db)):
    """Create a new rule."""
    try:
        rule = Rule(
            name=rule_data["name"],
            definition=rule_data["definition"]
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return {"id": rule.id, "name": rule.name, "version": rule.version, "enabled": rule.enabled, "definition": rule.definition, "created_at": rule.created_at, "updated_at": rule.updated_at}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Alert management endpoints
@app.get("/api/alerts")
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get alerts with filtering and pagination."""
    try:
        query = db.query(Alert)
        
        if severity:
            query = query.filter(Alert.severity == severity)
        if status:
            query = query.filter(Alert.status == status)
        
        alerts = query.offset(skip).limit(limit).all()
        return [{"id": a.id, "rule_id": a.rule_id, "host_id": a.host_id, "severity": a.severity, "title": a.title, "description": a.description, "status": a.status, "first_seen": a.first_seen, "last_seen": a.last_seen} for a in alerts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/alerts/{alert_id}")
async def update_alert(alert_id: int, alert_data: dict, db: Session = Depends(get_db)):
    """Update an alert."""
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        for field, value in alert_data.items():
            if hasattr(alert, field):
                setattr(alert, field, value)
        
        db.commit()
        db.refresh(alert)
        return {"id": alert.id, "rule_id": alert.rule_id, "host_id": alert.host_id, "severity": alert.severity, "title": alert.title, "description": alert.description, "status": alert.status, "first_seen": alert.first_seen, "last_seen": alert.last_seen}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Run the application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
