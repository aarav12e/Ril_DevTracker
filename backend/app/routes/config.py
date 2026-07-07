from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import date, datetime
import pandas as pd
import io
from app.core.database import get_db, get_next_sequence_value
from app.core.security import get_current_user, require_admin
from app.models import Role, RolesConfig, TaskUpload, User

router = APIRouter(prefix="/api/config", tags=["Config & Export"])


@router.get("/roles")
def list_roles(db = Depends(get_db), _=Depends(get_current_user)):
    cursor = db.roles.find().sort("access_level", 1)
    return [Role(**r) for r in cursor]


@router.get("/roles-config")
def list_roles_config(db = Depends(get_db), _=Depends(require_admin)):
    cursor = db.roles_config.find()
    return [RolesConfig(**rc) for rc in cursor]


@router.patch("/roles-config/{role_name}")
def update_upload_window(
    role_name: str,
    upload_allowed: Optional[bool] = None,
    window_start: Optional[date] = None,
    window_end: Optional[date] = None,
    db = Depends(get_db),
    _=Depends(require_admin),
):
    config_dict = db.roles_config.find_one({"role_name": role_name})

    update_fields = {}
    if upload_allowed is not None:
        update_fields["upload_allowed"] = upload_allowed
    if window_start:
        update_fields["upload_window_start"] = str(window_start)
    if window_end:
        update_fields["upload_window_end"] = str(window_end)

    if not config_dict:
        config_id = get_next_sequence_value("roles_config_id")
        doc = {
            "id": config_id,
            "role_name": role_name,
            "domain": None,
            "upload_allowed": upload_allowed if upload_allowed is not None else True,
            "upload_window_start": str(window_start) if window_start else None,
            "upload_window_end": str(window_end) if window_end else None,
            "created_at": datetime.utcnow()
        }
        db.roles_config.insert_one(doc)
    else:
        if update_fields:
            db.roles_config.update_one({"role_name": role_name}, {"$set": update_fields})

    return {"message": f"Config updated for role '{role_name}'"}


@router.get("/export/excel")
def export_to_excel(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    filt = {}
    if current_user.role in ("developer", "intern"):
        filt["user_id"] = current_user.id
    elif user_id:
        filt["user_id"] = user_id
        
    if from_date or to_date:
        date_query = {}
        if from_date:
            date_query["$gte"] = str(from_date)
        if to_date:
            date_query["$lte"] = str(to_date)
        filt["start_date"] = date_query
        
    if status:
        filt["status"] = status

    cursor = db.task_uploads.find(filt).sort("created_at", -1)
    tasks = [TaskUpload(**t) for t in cursor]

    rows = []
    for t in tasks:
        rows.append({
            "Sr No.": t.ticket_id,
            "Track": t.track or "",
            "Dev Type": t.dev_type_task or "",
            "Module": t.module or "",
            "Type of Development": t.type_of_development or "",
            "ProjectID / CCB ID / CD No.": t.cd_number or "",
            "Development Subject": t.task_title,
            "Category": t.category or "",
            "Development Description": t.description or "",
            "Functional Team": t.functional_team or "",
            "Developer Name": t.developer_name,
            "Start Date": str(t.start_date) if t.start_date else "",
            "End Date": str(t.due_date) if t.due_date else "",
            "Status": t.status,
            "Remarks": t.remarks or "",
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
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    filt = {}
    if current_user.role in ("developer", "intern"):
        filt["user_id"] = current_user.id
    elif user_id:
        filt["user_id"] = user_id
        
    if from_date or to_date:
        date_query = {}
        if from_date:
            date_query["$gte"] = str(from_date)
        if to_date:
            date_query["$lte"] = str(to_date)
        filt["start_date"] = date_query

    cursor = db.task_uploads.find(filt)
    tasks = [TaskUpload(**t) for t in cursor]
    
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
