from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db, get_next_sequence_value
from app.core.security import get_current_user, require_admin_or_manager
from app.models import TaskUpload, User
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.services.utils import notify_admins

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    track: Optional[str] = None,
    user_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    filt = {}
    if current_user.role in ("developer", "intern"):
        filt["user_id"] = current_user.id
    elif user_id:
        filt["user_id"] = user_id

    if status:
        filt["status"] = status
    if priority:
        filt["priority"] = priority
    if track:
        filt["track"] = track

    if from_date or to_date:
        date_query = {}
        if from_date:
            date_query["$gte"] = str(from_date)
        if to_date:
            date_query["$lte"] = str(to_date)
        filt["start_date"] = date_query

    cursor = db.task_uploads.find(filt).sort("created_at", -1).skip(skip).limit(limit)
    return [TaskUpload(**t) for t in cursor]


@router.get("/my", response_model=List[TaskResponse])
def my_tasks(
    status: Optional[str] = None,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    filt = {"user_id": current_user.id}
    if status:
        filt["status"] = status
    cursor = db.task_uploads.find(filt).sort("created_at", -1)
    return [TaskUpload(**t) for t in cursor]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task_dict = db.task_uploads.find_one({"id": task_id})
    if not task_dict:
        raise HTTPException(status_code=404, detail="Task not found")

    task = TaskUpload(**task_dict)
    if current_user.role in ("developer", "intern") and task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return task


@router.post("", response_model=TaskResponse)
def create_task(
    payload: TaskCreate,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task_id = get_next_sequence_value("task_id")
    ticket_id = f"SR-{task_id:04d}"

    has_time = False
    if payload.total_seconds and payload.total_seconds > 0:
        has_time = True
    elif payload.hours_logged and payload.hours_logged > 0:
        has_time = True

    timer_status = "completed" if has_time else "idle"
    status = "completed" if has_time else "in_progress"
    completed_at = datetime.utcnow() if has_time else None
    
    task = TaskUpload(
        id=task_id,
        ticket_id=ticket_id,
        user_id=current_user.id,
        task_title=payload.task_title,
        description=payload.description,
        priority=payload.priority,
        start_date=payload.start_date or date.today(),
        due_date=payload.due_date,
        track=payload.track,
        dev_type_task=payload.dev_type_task,
        type_of_development=payload.type_of_development,
        cd_number=payload.cd_number,
        functional_team=payload.functional_team,
        assigned_by=payload.assigned_by,
        hours_logged=payload.hours_logged or 0.0,
        total_seconds=payload.total_seconds or (int(round((payload.hours_logged or 0) * 3600))),
        upload_source="manual",
        status=status,
        timer_status=timer_status,
        completed_at=completed_at,
        module=payload.module,
        category=payload.category,
        remarks=payload.remarks,
    )
    db.task_uploads.insert_one(task.to_dict())
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task_dict = db.task_uploads.find_one({"id": task_id})
    if not task_dict:
        raise HTTPException(status_code=404, detail="Task not found")

    task = TaskUpload(**task_dict)
    if current_user.role in ("developer", "intern") and task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's task")

    update_data = payload.model_dump(exclude_unset=True)

    has_time = False
    if "hours_logged" in update_data:
        val = update_data["hours_logged"]
        if val is not None and float(val) > 0:
            update_data["hours_logged"] = float(val)
            update_data["total_seconds"] = int(float(val) * 3600)
            has_time = True
        else:
            update_data["hours_logged"] = 0.0
            update_data["total_seconds"] = 0

    if "total_seconds" in update_data:
        val = update_data["total_seconds"]
        if val is not None and int(val) > 0:
            has_time = True

    if has_time:
        update_data["timer_status"] = "completed"
        update_data["status"] = "completed"
        if not task_dict.get("completed_at"):
            update_data["completed_at"] = datetime.utcnow()
    else:
        if "hours_logged" in update_data and (update_data["hours_logged"] == 0 or update_data["hours_logged"] is None):
            update_data["timer_status"] = "idle"

    if update_data:
        db.task_uploads.update_one({"id": task_id}, {"$set": update_data})

    final_dict = db.task_uploads.find_one({"id": task_id})
    return TaskUpload(**final_dict)


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task_dict = db.task_uploads.find_one({"id": task_id})
    if not task_dict:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role in ("developer", "intern") and task_dict["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own tasks")

    db.task_uploads.delete_one({"id": task_id})
    db.task_sessions.delete_many({"task_id": task_id})
    return {"message": f"Task {task_dict['ticket_id']} deleted"}
