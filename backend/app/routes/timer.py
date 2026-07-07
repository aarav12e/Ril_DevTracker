from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.core.database import get_db, get_next_sequence_value
from app.core.security import get_current_user
from app.models import TaskUpload, TaskSession
from app.schemas import TimerActionResponse, TimerStatusResponse

router = APIRouter(prefix="/api/timer", tags=["Timer"])


def _get_owned_task(task_id: int, user_id: int, db) -> TaskUpload:
    task_dict = db.task_uploads.find_one({"id": task_id})
    if not task_dict:
        raise HTTPException(status_code=404, detail="Task not found")
    task = TaskUpload(**task_dict)
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your task")
    return task


def _pause_active_tasks(user_id: int, db):
    """Pause any currently active task for this user."""
    cursor = db.task_uploads.find({
        "user_id": user_id,
        "timer_status": "active",
    })

    for t_dict in cursor:
        task_id = t_dict["id"]
        # Find open session
        open_session = db.task_sessions.find_one({
            "task_id": task_id,
            "ended_at": None,
            "paused_at": None,
        })

        if open_session:
            now = datetime.utcnow()
            started_at = open_session["started_at"]
            if isinstance(started_at, str):
                started_at = datetime.fromisoformat(started_at)
            elapsed = int((now - started_at).total_seconds())
            
            db.task_sessions.update_one(
                {"id": open_session["id"]},
                {"$set": {"paused_at": now, "duration_seconds": elapsed}}
            )
            db.task_uploads.update_one(
                {"id": task_id},
                {"$inc": {"total_seconds": elapsed}, "$set": {"timer_status": "paused", "status": "in_progress"}}
            )
        else:
            db.task_uploads.update_one(
                {"id": task_id},
                {"$set": {"timer_status": "paused", "status": "in_progress"}}
            )


@router.post("/start/{task_id}", response_model=TimerActionResponse)
def start_timer(
    task_id: int,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status == "completed":
        raise HTTPException(status_code=400, detail="Task already completed")
    if task.timer_status == "active":
        raise HTTPException(status_code=400, detail="Timer already running")

    # Pause any other active task first
    _pause_active_tasks(current_user.id, db)

    session_count = db.task_sessions.count_documents({"task_id": task_id})
    session_id = get_next_sequence_value("session_id")

    session = TaskSession(
        id=session_id,
        task_id=task_id,
        user_id=current_user.id,
        session_number=session_count + 1,
        started_at=datetime.utcnow(),
    )
    db.task_sessions.insert_one(session.to_dict())

    db.task_uploads.update_one(
        {"id": task_id},
        {"$set": {"timer_status": "active", "status": "in_progress"}}
    )

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
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status != "active":
        raise HTTPException(status_code=400, detail="Timer is not running")

    open_session = db.task_sessions.find_one({
        "task_id": task_id,
        "ended_at": None,
        "paused_at": None,
    })

    now = datetime.utcnow()
    if open_session:
        started_at = open_session["started_at"]
        if isinstance(started_at, str):
            started_at = datetime.fromisoformat(started_at)
        elapsed = int((now - started_at).total_seconds())
        
        db.task_sessions.update_one(
            {"id": open_session["id"]},
            {"$set": {"paused_at": now, "duration_seconds": elapsed}}
        )
        db.task_uploads.update_one(
            {"id": task_id},
            {"$inc": {"total_seconds": elapsed}, "$set": {"timer_status": "paused"}}
        )
        task.total_seconds += elapsed
    else:
        db.task_uploads.update_one(
            {"id": task_id},
            {"$set": {"timer_status": "paused"}}
        )

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
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status == "active":
        raise HTTPException(status_code=400, detail="Timer already running")
    if task.timer_status == "completed":
        raise HTTPException(status_code=400, detail="Task already completed")

    # Pause any currently active task
    _pause_active_tasks(current_user.id, db)

    session_count = db.task_sessions.count_documents({"task_id": task_id})
    session_id = get_next_sequence_value("session_id")
    
    session = TaskSession(
        id=session_id,
        task_id=task_id,
        user_id=current_user.id,
        session_number=session_count + 1,
        started_at=datetime.utcnow(),
    )
    db.task_sessions.insert_one(session.to_dict())

    db.task_uploads.update_one(
        {"id": task_id},
        {"$set": {"timer_status": "active"}}
    )

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
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    open_session = db.task_sessions.find_one({
        "task_id": task_id,
        "ended_at": None,
    })

    now = datetime.utcnow()
    if open_session:
        started_at = open_session["started_at"]
        if isinstance(started_at, str):
            started_at = datetime.fromisoformat(started_at)
        elapsed = int((now - started_at).total_seconds())
        
        db.task_sessions.update_one(
            {"id": open_session["id"]},
            {"$set": {"ended_at": now, "duration_seconds": elapsed}}
        )
        db.task_uploads.update_one(
            {"id": task_id},
            {"$inc": {"total_seconds": elapsed}}
        )
        task.total_seconds += elapsed

    hours_logged = round(task.total_seconds / 3600, 2)
    db.task_uploads.update_one(
        {"id": task_id},
        {"$set": {
            "timer_status": "completed",
            "status": "completed",
            "completed_at": now,
            "hours_logged": hours_logged
        }}
    )

    return TimerActionResponse(
        task_id=task.id,
        ticket_id=task.ticket_id,
        timer_status="completed",
        total_seconds=task.total_seconds,
        message=f"Task {task.ticket_id} marked complete. Total: {hours_logged}h",
    )


@router.post("/switch/{task_id}", response_model=TimerActionResponse)
def switch_to_task(
    task_id: int,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)

    if task.timer_status == "completed":
        raise HTTPException(status_code=400, detail="Task already completed")

    _pause_active_tasks(current_user.id, db)

    session_count = db.task_sessions.count_documents({"task_id": task_id})
    session_id = get_next_sequence_value("session_id")
    
    session = TaskSession(
        id=session_id,
        task_id=task_id,
        user_id=current_user.id,
        session_number=session_count + 1,
        started_at=datetime.utcnow(),
    )
    db.task_sessions.insert_one(session.to_dict())

    db.task_uploads.update_one(
        {"id": task_id},
        {"$set": {"timer_status": "active", "status": "in_progress"}}
    )

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
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = _get_owned_task(task_id, current_user.id, db)
    sessions = list(db.task_sessions.find({"task_id": task_id}))

    current_session_seconds = 0
    if task.timer_status == "active":
        open_session = next((s for s in sessions if not s.get("ended_at") and not s.get("paused_at")), None)
        if open_session:
            started_at = open_session["started_at"]
            if isinstance(started_at, str):
                started_at = datetime.fromisoformat(started_at)
            current_session_seconds = int(
                (datetime.utcnow() - started_at).total_seconds()
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
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task_dict = db.task_uploads.find_one({
        "user_id": current_user.id,
        "timer_status": "active",
    })

    if not task_dict:
        return {"active_task": None}

    task = TaskUpload(**task_dict)
    open_session = db.task_sessions.find_one({
        "task_id": task.id,
        "ended_at": None,
        "paused_at": None,
    })

    current_secs = 0
    if open_session:
        started_at = open_session["started_at"]
        if isinstance(started_at, str):
            started_at = datetime.fromisoformat(started_at)
        current_secs = int((datetime.utcnow() - started_at).total_seconds())

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
