from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import get_current_user, require_admin_or_manager
from app.models import TaskUpload, User
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.services.utils import generate_ticket_id

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
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(TaskUpload)

    # Scope: non-admin/manager sees only own tasks
    if current_user.role in ("developer", "intern"):
        query = query.filter(TaskUpload.user_id == current_user.id)
    elif user_id:
        query = query.filter(TaskUpload.user_id == user_id)

    if status:
        query = query.filter(TaskUpload.status == status)
    if priority:
        query = query.filter(TaskUpload.priority == priority)
    if track:
        query = query.filter(TaskUpload.track == track)
    if from_date:
        query = query.filter(TaskUpload.start_date >= from_date)
    if to_date:
        query = query.filter(TaskUpload.due_date <= to_date)

    return query.order_by(TaskUpload.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/my", response_model=List[TaskResponse])
def my_tasks(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(TaskUpload).filter(TaskUpload.user_id == current_user.id)
    if status:
        query = query.filter(TaskUpload.status == status)
    return query.order_by(TaskUpload.created_at.desc()).all()


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = db.query(TaskUpload).filter(TaskUpload.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role in ("developer", "intern") and task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return task


@router.post("", response_model=TaskResponse)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ticket = generate_ticket_id(db)

    task = TaskUpload(
        user_id=current_user.id,
        ticket_id=ticket,
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
        status="pending",
        timer_status="idle",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = db.query(TaskUpload).filter(TaskUpload.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role in ("developer", "intern") and task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's task")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "hours_logged":
            if value is not None:
                task.hours_logged = value
                task.total_seconds = int(float(value) * 3600)
            else:
                task.hours_logged = 0.00
                task.total_seconds = 0
        else:
            setattr(task, field, value)

    if payload.status == "completed" and not task.completed_at:
        task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_manager),
):
    task = db.query(TaskUpload).filter(TaskUpload.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": f"Task {task.ticket_id} deleted"}
