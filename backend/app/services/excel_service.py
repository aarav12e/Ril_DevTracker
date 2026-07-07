import io
import math
from datetime import datetime, date
from typing import Optional, List
import pandas as pd

from app.core.database import get_next_sequence_value
from app.models.user import User
from app.models.task import TaskUpload
from app.models.upload import UploadHistory
from app.services.utils import notify_admins

REQUIRED_COLUMNS = {"task_title", "status", "priority"}

COLUMN_MAP = {
    "task_title": "task_title",
    "title": "task_title",
    "subject": "task_title",
    "development subject": "task_title",
    "description": "description",
    "remarks": "description",
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
    "cd number": "cd_number",
    "functional_team": "functional_team",
    "functional team": "functional_team",
    "hours_logged": "hours_logged",
    "hours": "hours_logged",
    "hours logged": "hours_logged",
    "time (min)": "hours_logged",
    "time_min": "hours_logged",
    "developer": "developer",
    "developers": "developer",
}

VALID_STATUSES = {"in_progress", "completed", "fut", "hold_functional", "hold_developer"}
VALID_PRIORITIES = {"low", "medium", "high"}


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip().lower() for c in df.columns]
    rename = {}
    for col in df.columns:
        if col in COLUMN_MAP:
            rename[col] = COLUMN_MAP[col]
    return df.rename(columns=rename)


def _clean_row(row: dict) -> dict:
    cleaned = {}
    
    # 1. Clean strings
    for field in ("task_title", "description", "status", "priority", "track", "dev_type_task", "type_of_development", "cd_number", "functional_team", "developer"):
        val = row.get(field)
        if val is None:
            cleaned[field] = None
        else:
            val_str = str(val).strip()
            if val_str.lower() in ("nan", "none", "nat", ""):
                cleaned[field] = None
            else:
                if val_str.endswith(".0"):
                    val_str = val_str[:-2]
                cleaned[field] = val_str

    # 2. Parse dates
    for field in ("start_date", "due_date"):
        val = row.get(field)
        if val is None:
            cleaned[field] = None
        elif isinstance(val, date):
            if isinstance(val, datetime):
                cleaned[field] = val.date()
            else:
                cleaned[field] = val
        elif isinstance(val, pd.Timestamp):
            cleaned[field] = val.to_pydatetime().date()
        else:
            try:
                val_str = str(val).strip()
                if val_str.lower() in ("nan", "none", "nat", ""):
                    cleaned[field] = None
                else:
                    parsed_d = None
                    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%Y/%m/%d", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"):
                        try:
                            parsed_d = datetime.strptime(val_str, fmt).date()
                            break
                        except ValueError:
                            continue
                    cleaned[field] = parsed_d
            except Exception:
                cleaned[field] = None

    # 3. Time (min) or hours_logged
    val = row.get("hours_logged")
    if val is None:
        cleaned["hours_logged"] = None
    else:
        try:
            fval = float(val)
            if math.isnan(fval) or math.isinf(fval):
                cleaned["hours_logged"] = None
            else:
                cleaned["hours_logged"] = fval
        except (ValueError, TypeError):
            cleaned["hours_logged"] = None

    return cleaned


def _normalize_status(val: Optional[str]) -> str:
    if not val:
        return "in_progress"
    val_str = str(val).strip().lower()
    if val_str in ("wip", "in progress", "in-progress", "in_progress", "active"):
        return "in_progress"
    if val_str in ("hold by functional", "hold_functional", "hold by functional team", "hold"):
        return "hold_functional"
    if val_str in ("hold by developer", "hold_developer"):
        return "hold_developer"
    if val_str in ("completed", "done", "complete", "prod"):
        return "completed"
    if val_str in ("pending", "todo", "to do", "to-do", "idle"):
        return "in_progress"
    if val_str in ("fut", "future"):
        return "fut"
    return "in_progress"


def _normalize_priority(val: Optional[str]) -> str:
    if not val:
        return "medium"
    val_str = str(val).strip().lower()
    if val_str in ("high", "h"):
        return "high"
    if val_str in ("medium", "m"):
        return "medium"
    if val_str in ("low", "l"):
        return "low"
    return "medium"


def _validate_row(row: dict, row_num: int, current_user, db) -> Optional[str]:
    # Check if row is completely empty (after cleaning)
    non_empty = [v for k, v in row.items() if v is not None and str(v).strip() != ""]
    if not non_empty:
        return None

    # Default task_title if missing
    if not row.get("task_title"):
        row["task_title"] = "Untitled Task"

    # Normalize status and priority in place
    row["status"] = _normalize_status(row.get("status"))
    row["priority"] = _normalize_priority(row.get("priority"))

    return None


def _is_duplicate(row: dict, user_id: int, db) -> bool:
    start_date_str = str(row.get("start_date")) if row.get("start_date") else None
    dup = db.task_uploads.find_one({
        "user_id": user_id,
        "task_title": row.get("task_title"),
        "start_date": start_date_str,
    })
    return dup is not None


def validate_excel_workbook(
    db,
    file_contents: bytes,
    sheet_name: Optional[str],
    current_user
) -> dict:
    """Dry-run check of the excel template formatting and rows."""
    xl = pd.ExcelFile(io.BytesIO(file_contents))
    target_sheet = sheet_name or xl.sheet_names[0]
    df = pd.read_excel(io.BytesIO(file_contents), sheet_name=target_sheet)
    df = _normalize_columns(df)
    df = df.where(pd.notna(df), None)

    errors = []
    valid = 0
    duplicates = 0
    preview = []

    for i, row in enumerate(df.to_dict(orient="records"), start=2):
        row = _clean_row(row)
        non_empty = [v for k, v in row.items() if v is not None and str(v).strip() != ""]
        if not non_empty:
            continue

        err = _validate_row(row, i, current_user, db)
        if err:
            errors.append({"row": i, "error": err})
            continue

        row_user_id = current_user.id
        dev_val = row.get("developer")
        if dev_val:
            dev_str = str(dev_val).strip().lower()
            matched_user = db.users.find_one({
                "$or": [
                    {"full_name": {"$regex": f"^{dev_str}$", "$options": "i"}},
                    {"username": {"$regex": f"^{dev_str}$", "$options": "i"}},
                    {"email": {"$regex": f"^{dev_str}$", "$options": "i"}}
                ]
            })
            if matched_user:
                row_user_id = matched_user["id"]
            else:
                if current_user.role in ("admin", "manager"):
                    errors.append({"row": i, "error": f"Developer '{dev_val}' not found in system"})
                    continue

        if current_user.role in ("developer", "intern"):
            row_user_id = current_user.id

        if _is_duplicate(row, row_user_id, db):
            duplicates += 1
        else:
            valid += 1

        if i <= 11:
            # format dates as strings for preview
            row_preview = {**row}
            if row_preview.get("start_date"):
                row_preview["start_date"] = str(row_preview["start_date"])
            if row_preview.get("due_date"):
                row_preview["due_date"] = str(row_preview["due_date"])
            preview.append(row_preview)

    return {
        "total_rows": len(df),
        "valid_rows": valid,
        "error_rows": len(errors),
        "duplicate_rows": duplicates,
        "errors": errors,
        "preview": preview,
    }


def import_excel_workbook(
    db,
    file_name: str,
    file_contents: bytes,
    sheet_name: Optional[str],
    week_label: Optional[str],
    skip_duplicates: bool,
    current_user
) -> UploadHistory:
    """Parses Excel, validates records, creates historical record, and inserts tasks in bulk."""
    xl = pd.ExcelFile(io.BytesIO(file_contents))
    target_sheet = sheet_name or xl.sheet_names[0]
    df = pd.read_excel(io.BytesIO(file_contents), sheet_name=target_sheet)
    df = _normalize_columns(df)
    df = df.where(pd.notna(df), None)

    detected_label = week_label or target_sheet
    errors = []
    valid_tasks = []
    duplicate_count = 0

    for i, row in enumerate(df.to_dict(orient="records"), start=2):
        row = _clean_row(row)
        non_empty = [v for k, v in row.items() if v is not None and str(v).strip() != ""]
        if not non_empty:
            continue

        err = _validate_row(row, i, current_user, db)
        if err:
            errors.append({"row": i, "error": err})
            continue

        row_user_id = current_user.id
        dev_val = row.get("developer")
        if dev_val:
            dev_str = str(dev_val).strip().lower()
            matched_user = db.users.find_one({
                "$or": [
                    {"full_name": {"$regex": f"^{dev_str}$", "$options": "i"}},
                    {"username": {"$regex": f"^{dev_str}$", "$options": "i"}},
                    {"email": {"$regex": f"^{dev_str}$", "$options": "i"}}
                ]
            })
            if matched_user:
                row_user_id = matched_user["id"]

        if current_user.role in ("developer", "intern"):
            row_user_id = current_user.id

        if _is_duplicate(row, row_user_id, db):
            duplicate_count += 1
            if skip_duplicates:
                continue
            errors.append({"row": i, "error": f"Duplicate: '{row.get('task_title')}' on {row.get('start_date')}"})
            continue

        # Convert time (min) to hours if needed
        hours = 0.0
        if row.get("hours_logged") is not None:
            val = row["hours_logged"]
            try:
                fval = float(val)
                if not math.isnan(fval) and not math.isinf(fval):
                    hours = fval / 60 if fval > 24 else fval
            except (ValueError, TypeError):
                hours = 0.0

        status_val = row.get("status")
        status_str = str(status_val).lower().strip() if status_val is not None else "in_progress"

        priority_val = row.get("priority")
        priority_str = str(priority_val).lower().strip() if priority_val is not None else "medium"

        valid_tasks.append({
            "user_id": row_user_id,
            "task_title": str(row.get("task_title", "")).strip(),
            "description": row.get("description"),
            "status": status_str,
            "priority": priority_str,
            "start_date": row.get("start_date"),
            "due_date": row.get("due_date"),
            "track": row.get("track"),
            "dev_type_task": row.get("dev_type_task"),
            "type_of_development": row.get("type_of_development"),
            "cd_number": row.get("cd_number"),
            "functional_team": row.get("functional_team"),
            "hours_logged": hours,
            "total_seconds": int(round(hours * 3600)),
        })

    # Create upload history record
    history_id = get_next_sequence_value("upload_history_id")
    history = UploadHistory(
        id=history_id,
        uploaded_by=current_user.id,
        week_label=detected_label,
        sheet_name=target_sheet,
        original_filename=file_name,
        source="excel",
        total_rows=len(df),
        valid_rows=len(valid_tasks),
        error_rows=len(errors),
    )
    db.upload_history.insert_one(history.to_dict())

    # Bulk insert valid tasks
    for task_data in valid_tasks:
        target_user_id = task_data.pop("user_id", current_user.id)
        task_id = get_next_sequence_value("task_id")
        
        start_date_str = str(task_data.get("start_date")) if task_data.get("start_date") else None
        due_date_str = str(task_data.get("due_date")) if task_data.get("due_date") else None

        task = TaskUpload(
            id=task_id,
            ticket_id=f"SR-{task_id:04d}",
            user_id=target_user_id,
            upload_source="excel",
            file_name=file_name,
            upload_history_id=history.id,
            timer_status="idle",
            status=task_data["status"],
            priority=task_data["priority"],
            task_title=task_data["task_title"],
            description=task_data["description"],
            start_date=start_date_str,
            due_date=due_date_str,
            track=task_data["track"],
            dev_type_task=task_data["dev_type_task"],
            type_of_development=task_data["type_of_development"],
            cd_number=task_data["cd_number"],
            functional_team=task_data["functional_team"],
            hours_logged=task_data["hours_logged"],
            total_seconds=task_data["total_seconds"],
        )
        db.task_uploads.insert_one(task.to_dict())

    # Notify all admins
    notify_admins(
        db=db,
        message=(
            f"{current_user.username} uploaded {len(valid_tasks)} logs "
            f"from '{file_name}' (week: {detected_label}). "
            f"{len(errors)} errors, {duplicate_count} duplicates skipped."
        ),
        triggered_by=current_user.id,
        notif_type="upload",
    )

    return history
