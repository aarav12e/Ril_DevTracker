from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date
import pandas as pd
import io
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import TaskUpload, UploadHistory, User
from app.schemas.schemas import UploadHistoryResponse, UploadValidationResult
from app.services.utils import generate_ticket_id, notify_admins, is_upload_window_open

router = APIRouter(prefix="/api/upload", tags=["Excel Upload"])

REQUIRED_COLUMNS = {
    "task_title", "status", "priority"
}

COLUMN_MAP = {
    "task_title": "task_title",
    "title": "task_title",
    "subject": "task_title",
    "development subject": "task_title",
    "description": "description",
    "status": "status",
    "priority": "priority",
    "start_date": "start_date",
    "start date": "start_date",
    "due_date": "due_date",
    "end date": "due_date",
    "end_date": "due_date",
    "track": "track",
    "dev_type": "dev_type_task",
    "dev type": "dev_type_task",
    "type_of_development": "type_of_development",
    "type of development": "type_of_development",
    "cd_number": "cd_number",
    "cd": "cd_number",
    "functional_team": "functional_team",
    "functional team": "functional_team",
    "hours_logged": "hours_logged",
    "time (min)": "hours_logged",
    "time_min": "hours_logged",
}

VALID_STATUSES = {"pending", "in_progress", "completed", "on_hold"}
VALID_PRIORITIES = {"low", "medium", "high"}


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip().lower() for c in df.columns]
    rename = {}
    for col in df.columns:
        if col in COLUMN_MAP:
            rename[col] = COLUMN_MAP[col]
    return df.rename(columns=rename)


def _validate_row(row: dict, row_num: int, current_user, db: Session) -> Optional[str]:
    if not row.get("task_title"):
        return f"Row {row_num}: task_title is required"

    status = str(row.get("status", "pending")).lower().strip()
    if status not in VALID_STATUSES:
        return f"Row {row_num}: invalid status '{status}'"

    priority = str(row.get("priority", "medium")).lower().strip()
    if priority not in VALID_PRIORITIES:
        return f"Row {row_num}: invalid priority '{priority}'"

    return None


def _is_duplicate(row: dict, user_id: int, db: Session) -> bool:
    return bool(
        db.query(TaskUpload).filter(
            TaskUpload.user_id == user_id,
            TaskUpload.task_title == row.get("task_title"),
            TaskUpload.start_date == row.get("start_date"),
        ).first()
    )


@router.post("/excel", response_model=UploadHistoryResponse)
async def upload_excel(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    week_label: Optional[str] = Form(None),
    skip_duplicates: bool = Form(True),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Upload window check
    if not is_upload_window_open(db, current_user.role):
        raise HTTPException(status_code=403, detail="Upload window is currently closed for your role")

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are allowed")

    contents = await file.read()

    try:
        xl = pd.ExcelFile(io.BytesIO(contents))
        sheets = xl.sheet_names

        target_sheet = sheet_name or sheets[0]
        df = pd.read_excel(io.BytesIO(contents), sheet_name=target_sheet)
        df = _normalize_columns(df)
        df = df.where(pd.notna(df), None)

        # Auto-detect week label from sheet name if not provided
        detected_label = week_label or target_sheet

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")

    errors = []
    valid_tasks = []
    duplicate_count = 0

    for i, row in enumerate(df.to_dict(orient="records"), start=2):
        err = _validate_row(row, i, current_user, db)
        if err:
            errors.append({"row": i, "error": err})
            continue

        # Scope enforcement: developer/intern can only upload their own rows
        # (If file has a developer column and it doesn't match, skip)
        # We auto-assign to current_user

        if _is_duplicate(row, current_user.id, db):
            duplicate_count += 1
            if skip_duplicates:
                continue
            errors.append({"row": i, "error": f"Duplicate: '{row.get('task_title')}' on {row.get('start_date')}"})
            continue

        # Convert time (min) to hours if needed
        hours = 0.0
        if row.get("hours_logged"):
            val = row["hours_logged"]
            try:
                hours = float(val) / 60 if float(val) > 24 else float(val)
            except (ValueError, TypeError):
                hours = 0.0

        valid_tasks.append({
            "task_title": str(row.get("task_title", "")).strip(),
            "description": row.get("description"),
            "status": str(row.get("status", "pending")).lower().strip(),
            "priority": str(row.get("priority", "medium")).lower().strip(),
            "start_date": row.get("start_date"),
            "due_date": row.get("due_date"),
            "track": row.get("track"),
            "dev_type_task": row.get("dev_type_task"),
            "type_of_development": row.get("type_of_development"),
            "cd_number": row.get("cd_number"),
            "functional_team": row.get("functional_team"),
            "hours_logged": hours,
        })

    # Create upload history record
    history = UploadHistory(
        uploaded_by=current_user.id,
        week_label=detected_label,
        sheet_name=target_sheet,
        original_filename=file.filename,
        source="excel",
        total_rows=len(df),
        valid_rows=len(valid_tasks),
        error_rows=len(errors),
    )
    db.add(history)
    db.flush()

    # Bulk insert valid tasks
    for task_data in valid_tasks:
        task = TaskUpload(
            user_id=current_user.id,
            ticket_id=generate_ticket_id(db),
            upload_source="excel",
            file_name=file.filename,
            upload_history_id=history.id,
            timer_status="idle",
            **task_data,
        )
        db.add(task)

    db.commit()

    # Notify all admins
    notify_admins(
        db=db,
        message=(
            f"{current_user.username} uploaded {len(valid_tasks)} logs "
            f"from '{file.filename}' (week: {detected_label}). "
            f"{len(errors)} errors, {duplicate_count} duplicates skipped."
        ),
        triggered_by=current_user.id,
        notif_type="upload",
    )

    db.refresh(history)
    return history


@router.get("/history", response_model=list[UploadHistoryResponse])
def upload_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(UploadHistory)
    if current_user.role in ("developer", "intern"):
        query = query.filter(UploadHistory.uploaded_by == current_user.id)
    return query.order_by(UploadHistory.uploaded_at.desc()).limit(50).all()


@router.get("/validate", response_model=UploadValidationResult)
async def validate_excel(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Dry-run: validate without importing. Returns errors + preview."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files allowed")

    contents = await file.read()
    try:
        xl = pd.ExcelFile(io.BytesIO(contents))
        target_sheet = sheet_name or xl.sheet_names[0]
        df = pd.read_excel(io.BytesIO(contents), sheet_name=target_sheet)
        df = _normalize_columns(df)
        df = df.where(pd.notna(df), None)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    errors = []
    valid = 0
    duplicates = 0
    preview = []

    for i, row in enumerate(df.to_dict(orient="records"), start=2):
        err = _validate_row(row, i, current_user, db)
        if err:
            errors.append({"row": i, "error": err})
        else:
            if _is_duplicate(row, current_user.id, db):
                duplicates += 1
            else:
                valid += 1
        if i <= 11:
            preview.append(row)

    return UploadValidationResult(
        total_rows=len(df),
        valid_rows=valid,
        error_rows=len(errors),
        duplicate_rows=duplicates,
        errors=errors,
        preview=preview,
    )


@router.get("/template")
def download_template():
    """Download the standard Excel upload template."""
    df = pd.DataFrame(columns=[
        "task_title", "description", "status", "priority",
        "start_date", "due_date", "track", "dev_type",
        "type_of_development", "cd_number", "functional_team", "hours_logged"
    ])
    # Add sample row
    df.loc[0] = [
        "BPL Case Discount SOA", "SAP discount module fix", "in_progress", "high",
        "2026-06-01", "2026-06-05", "BPL", "SAP",
        "Development", "8089020", "Biswajit", "2.5"
    ]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="01_Week_Template")
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=devtracker_template.xlsx"},
    )
