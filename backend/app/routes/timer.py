from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import TaskUpload, TaskSession
from app.schemas import TimerActionResponse, TimerStatusResponse

router = APIRouter(prefix="/api/timer", tags=["Timer"])


def _get_owned_task(task_id: int, user_id: int, db: Session) -> TaskUpload:
    task = db.query(TaskUpload).filter(TaskUpload.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your task")
    return task


def _pause_active_tasks(user_id: int, db: Session):
    """Pause any currently active task for this user."""
    active_tasks = db.query(TaskUpload).filter(
        TaskUpload.user_id == user_id,
        TaskUpload.timer_status == "active",
    ).all()

    for task in active_tasks:
        # Find the open session and close it
        open_session = db.query(TaskSession).filter(
            TaskSession.task_id == task.id,
            TaskSession.ended_at == None,
            TaskSession.paused_at == None,
        ).first()

        if open_session:
            now = datetime.utcnow()
            elapsed = int((now - open_session.started_at).total_seconds())
            open_session.paused_at = now
            open_session.duration_seconds = elapsed
            task.total_seconds += elapsed

        task.timer_status = "paused"
        task.status = "in_progress"


@router.post("/start/{task_id}", response_model=TimerActionResponse)
def start_timer(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status == "completed":
        raise HTTPException(status_code=400, detail="Task already completed")
    if task.timer_status == "active":
        raise HTTPException(status_code=400, detail="Timer already running")

    # Pause any other active task first (only one active at a time)
    _pause_active_tasks(current_user.id, db)

    # Count existing sessions
    session_count = db.query(TaskSession).filter(TaskSession.task_id == task_id).count()

    session = TaskSession(
        task_id=task_id,
        user_id=current_user.id,
        session_number=session_count + 1,
        started_at=datetime.utcnow(),
    )
    db.add(session)

    task.timer_status = "active"
    task.status = "in_progress"
    db.commit()
    db.refresh(session)

    return TimerActionResponse(
        task_id=task.id,
        ticket_id=task.ticket_id,
        timer_status="active",
        total_seconds=task.total_seconds,
        message=f"Timer started for {task.ticket_id}",
        session_id=session.id,
    )


@router.post("/pause/{task_id}", response_model=TimerActionResponse)
def pause_timer(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status != "active":
        raise HTTPException(status_code=400, detail="Timer is not running")

    open_session = db.query(TaskSession).filter(
        TaskSession.task_id == task_id,
        TaskSession.ended_at == None,
        TaskSession.paused_at == None,
    ).first()

    now = datetime.utcnow()
    if open_session:
        elapsed = int((now - open_session.started_at).total_seconds())
        open_session.paused_at = now
        open_session.duration_seconds = elapsed
        task.total_seconds += elapsed

    task.timer_status = "paused"
    db.commit()

    return TimerActionResponse(
        task_id=task.id,
        ticket_id=task.ticket_id,
        timer_status="paused",
        total_seconds=task.total_seconds,
        message=f"Timer paused for {task.ticket_id}",
    )


@router.post("/resume/{task_id}", response_model=TimerActionResponse)
def resume_timer(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status == "active":
        raise HTTPException(status_code=400, detail="Timer already running")
    if task.timer_status == "completed":
        raise HTTPException(status_code=400, detail="Task already completed")

    # Pause any currently active task
    _pause_active_tasks(current_user.id, db)

    # New session for the resume
    session_count = db.query(TaskSession).filter(TaskSession.task_id == task_id).count()
    session = TaskSession(
        task_id=task_id,
        user_id=current_user.id,
        session_number=session_count + 1,
        started_at=datetime.utcnow(),
    )
    db.add(session)

    task.timer_status = "active"
    db.commit()
    db.refresh(session)

    return TimerActionResponse(
        task_id=task.id,
        ticket_id=task.ticket_id,
        timer_status="active",
        total_seconds=task.total_seconds,
        message=f"Timer resumed for {task.ticket_id}",
        session_id=session.id,
    )


@router.post("/complete/{task_id}", response_model=TimerActionResponse)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    # Close any open session
    open_session = db.query(TaskSession).filter(
        TaskSession.task_id == task_id,
        TaskSession.ended_at == None,
    ).first()

    now = datetime.utcnow()
    if open_session:
        elapsed = int((now - open_session.started_at).total_seconds())
        open_session.ended_at = now
        open_session.duration_seconds = elapsed
        task.total_seconds += elapsed

    task.timer_status = "completed"
    task.status = "completed"
    task.completed_at = now
    task.hours_logged = round(task.total_seconds / 3600, 2)
    db.commit()

    return TimerActionResponse(
        task_id=task.id,
        ticket_id=task.ticket_id,
        timer_status="completed",
        total_seconds=task.total_seconds,
        message=f"Task {task.ticket_id} marked complete. Total: {task.hours_logged}h",
    )


@router.post("/switch/{task_id}", response_model=TimerActionResponse)
def switch_to_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Pause current active task and start this one."""
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status == "completed":
        raise HTTPException(status_code=400, detail="Task already completed")

    _pause_active_tasks(current_user.id, db)

    session_count = db.query(TaskSession).filter(TaskSession.task_id == task_id).count()
    session = TaskSession(
        task_id=task_id,
        user_id=current_user.id,
        session_number=session_count + 1,
        started_at=datetime.utcnow(),
    )
    db.add(session)

    task.timer_status = "active"
    task.status = "in_progress"
    db.commit()
    db.refresh(session)

    return TimerActionResponse(
        task_id=task.id,
        ticket_id=task.ticket_id,
        timer_status="active",
        total_seconds=task.total_seconds,
        message=f"Switched to task {task.ticket_id}",
        session_id=session.id,
    )


@router.get("/status/{task_id}", response_model=TimerStatusResponse)
def get_timer_status(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)
    sessions = db.query(TaskSession).filter(TaskSession.task_id == task_id).all()

    # Calculate current session seconds if active
    current_session_seconds = 0
    if task.timer_status == "active":
        open_session = next((s for s in sessions if not s.ended_at and not s.paused_at), None)
        if open_session:
            current_session_seconds = int(
                (datetime.utcnow() - open_session.started_at).total_seconds()
            )

    return TimerStatusResponse(
        task_id=task.id,
        ticket_id=task.ticket_id,
        task_title=task.task_title,
        timer_status=task.timer_status,
        total_seconds=task.total_seconds,
        current_session_seconds=current_session_seconds,
        sessions_count=len(sessions),
    )


@router.get("/active/me")
def get_my_active_task(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Returns the currently active task for the logged-in user."""
    task = db.query(TaskUpload).filter(
        TaskUpload.user_id == current_user.id,
        TaskUpload.timer_status == "active",
    ).first()

    if not task:
        return {"active_task": None}

    open_session = db.query(TaskSession).filter(
        TaskSession.task_id == task.id,
        TaskSession.ended_at == None,
        TaskSession.paused_at == None,
    ).first()

    current_secs = 0
    if open_session:
        current_secs = int((datetime.utcnow() - open_session.started_at).total_seconds())

    return {
        "active_task": {
            "task_id": task.id,
            "ticket_id": task.ticket_id,
            "task_title": task.task_title,
            "track": task.track,
            "total_seconds": task.total_seconds + current_secs,
            "current_session_seconds": current_secs,
        }
    }
