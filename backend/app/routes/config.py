from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import pandas as pd
import io
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models import Role, RolesConfig, TaskUpload, User

router = APIRouter(prefix="/api/config", tags=["Config & Export"])


# ── Roles ──────────────────────────────────────────────────────
@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Role).order_by(Role.access_level).all()


@router.get("/roles-config")
def list_roles_config(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(RolesConfig).all()


@router.patch("/roles-config/{role_name}")
def update_upload_window(
    role_name: str,
    upload_allowed: Optional[bool] = None,
    window_start: Optional[date] = None,
    window_end: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    config = db.query(RolesConfig).filter(RolesConfig.role_name == role_name).first()
    if not config:
        config = RolesConfig(role_name=role_name)
        db.add(config)

    if upload_allowed is not None:
        config.upload_allowed = upload_allowed
    if window_start:
        config.upload_window_start = window_start
    if window_end:
        config.upload_window_end = window_end

    db.commit()
    return {"message": f"Config updated for role '{role_name}'"}


# ── Export ──────────────────────────────────────────────────────
@router.get("/export/excel")
def export_to_excel(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(TaskUpload)

    if current_user.role in ("developer", "intern"):
        query = query.filter(TaskUpload.user_id == current_user.id)
    elif user_id:
        query = query.filter(TaskUpload.user_id == user_id)
    if from_date:
        query = query.filter(TaskUpload.start_date >= from_date)
    if to_date:
        query = query.filter(TaskUpload.due_date <= to_date)
    if status:
        query = query.filter(TaskUpload.status == status)

    tasks = query.order_by(TaskUpload.created_at.desc()).all()

    rows = []
    for t in tasks:
        user = db.query(User).filter(User.id == t.user_id).first()
        rows.append({
            "Ticket ID": t.ticket_id,
            "Developer": user.username if user else "",
            "Track": t.track or "",
            "Dev Type": t.dev_type_task or "",
            "Type of Development": t.type_of_development or "",
            "CD Number": t.cd_number or "",
            "Task Title": t.task_title,
            "Functional Team": t.functional_team or "",
            "Status": t.status,
            "Priority": t.priority,
            "Start Date": str(t.start_date) if t.start_date else "",
            "Due Date": str(t.due_date) if t.due_date else "",
            "Hours Logged": float(t.hours_logged or 0),
            "Upload Source": t.upload_source,
            "Created At": str(t.created_at),
        })

    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="DevTracker_Export")
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=devtracker_export.xlsx"},
    )


@router.get("/export/csv")
def export_to_csv(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(TaskUpload)
    if current_user.role in ("developer", "intern"):
        query = query.filter(TaskUpload.user_id == current_user.id)
    elif user_id:
        query = query.filter(TaskUpload.user_id == user_id)
    if from_date:
        query = query.filter(TaskUpload.start_date >= from_date)
    if to_date:
        query = query.filter(TaskUpload.due_date <= to_date)

    tasks = query.all()
    rows = [{"ticket_id": t.ticket_id, "task_title": t.task_title,
             "status": t.status, "hours_logged": float(t.hours_logged or 0),
             "track": t.track, "created_at": str(t.created_at)} for t in tasks]

    df = pd.DataFrame(rows)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=devtracker_export.csv"},
    )
