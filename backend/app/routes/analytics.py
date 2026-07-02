from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, date, timedelta
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user, require_admin_or_manager
from app.models import TaskUpload, TaskSession, User
from app.services.utils import seconds_to_hours

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard/me")
def my_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    # Today's tasks
    today_tasks = db.query(TaskUpload).filter(
        TaskUpload.user_id == current_user.id,
        func.date(TaskUpload.created_at) == today,
    ).all()

    # This week total seconds
    week_sessions = db.query(TaskSession).join(TaskUpload).filter(
        TaskUpload.user_id == current_user.id,
        TaskSession.started_at >= datetime.combine(week_start, datetime.min.time()),
    ).all()
    week_seconds = sum(s.duration_seconds or 0 for s in week_sessions)

    # Active task
    active_task = db.query(TaskUpload).filter(
        TaskUpload.user_id == current_user.id,
        TaskUpload.timer_status == "active",
    ).first()

    # Active task current live seconds
    active_seconds = 0
    if active_task:
        open_session = db.query(TaskSession).filter(
            TaskSession.task_id == active_task.id,
            TaskSession.ended_at == None,
            TaskSession.paused_at == None,
        ).first()
        if open_session:
            active_seconds = int((datetime.utcnow() - open_session.started_at).total_seconds())

    # WIP and paused tasks
    wip_tasks = db.query(TaskUpload).filter(
        TaskUpload.user_id == current_user.id,
        TaskUpload.timer_status.in_(["active", "paused"]),
    ).all()

    # Today's time breakdown per task
    today_breakdown = []
    all_tasks = db.query(TaskUpload).filter(
        TaskUpload.user_id == current_user.id,
    ).all()

    for task in all_tasks:
        today_sessions = db.query(TaskSession).filter(
            TaskSession.task_id == task.id,
            func.date(TaskSession.started_at) == today,
        ).all()
        today_secs = sum(s.duration_seconds or 0 for s in today_sessions)
        if task.timer_status == "active" and task.id == (active_task.id if active_task else None):
            today_secs += active_seconds
        if today_secs > 0:
            today_breakdown.append({
                "task_id": task.id,
                "ticket_id": task.ticket_id,
                "task_title": task.task_title,
                "track": task.track,
                "seconds_today": today_secs,
                "hours_today": seconds_to_hours(today_secs),
                "status": task.timer_status,
            })

    completed_today = db.query(TaskUpload).filter(
        TaskUpload.user_id == current_user.id,
        TaskUpload.status == "completed",
        func.date(TaskUpload.completed_at) == today,
    ).count()

    return {
        "user": current_user.username,
        "today_date": str(today),
        "kpis": {
            "total_seconds_today": sum(t["seconds_today"] for t in today_breakdown),
            "total_hours_today": seconds_to_hours(sum(t["seconds_today"] for t in today_breakdown)),
            "total_hours_this_week": seconds_to_hours(week_seconds),
            "wip_count": len(wip_tasks),
            "active_count": sum(1 for t in wip_tasks if t.timer_status == "active"),
            "paused_count": sum(1 for t in wip_tasks if t.timer_status == "paused"),
            "completed_today": completed_today,
        },
        "active_task": {
            "task_id": active_task.id,
            "ticket_id": active_task.ticket_id,
            "task_title": active_task.task_title,
            "track": active_task.track,
            "total_seconds": active_task.total_seconds + active_seconds,
            "current_session_seconds": active_seconds,
        } if active_task else None,
        "today_breakdown": sorted(today_breakdown, key=lambda x: x["seconds_today"], reverse=True),
        "wip_tasks": [
            {
                "task_id": t.id,
                "ticket_id": t.ticket_id,
                "task_title": t.task_title,
                "track": t.track,
                "priority": t.priority,
                "timer_status": t.timer_status,
                "total_seconds": t.total_seconds,
                "total_hours": seconds_to_hours(t.total_seconds),
            }
            for t in wip_tasks
        ],
    }


@router.get("/dashboard/admin")
def admin_dashboard(
    week_offset: int = 0,
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_manager),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday()) - timedelta(weeks=week_offset)
    week_end = week_start + timedelta(days=6)

    week_start_dt = datetime.combine(week_start, datetime.min.time())
    week_end_dt = datetime.combine(week_end, datetime.max.time())

    # Total tasks this week
    week_tasks = db.query(TaskUpload).filter(
        TaskUpload.created_at.between(week_start_dt, week_end_dt)
    ).all()

    # Status breakdown
    status_counts = {}
    for task in week_tasks:
        status_counts[task.status] = status_counts.get(task.status, 0) + 1

    # Developer-wise hours this week
    developers = db.query(User).filter(
        User.role.in_(["developer", "intern"]),
        User.is_active == True,
    ).all()

    dev_breakdown = []
    for dev in developers:
        sessions = db.query(TaskSession).join(TaskUpload).filter(
            TaskUpload.user_id == dev.id,
            TaskSession.started_at.between(week_start_dt, week_end_dt),
        ).all()
        timer_secs = sum(s.duration_seconds or 0 for s in sessions)

        # Also count hours_logged from tasks that have no timer sessions (e.g. Excel imports)
        dev_tasks_this_week = db.query(TaskUpload).filter(
            TaskUpload.user_id == dev.id,
            TaskUpload.created_at.between(week_start_dt, week_end_dt),
        ).all()
        manual_secs = sum(
            int(round(float(t.hours_logged) * 3600))
            for t in dev_tasks_this_week
            if (t.hours_logged or 0) > 0 and t.total_seconds == 0
        )
        total_secs = timer_secs + manual_secs

        task_count = len(dev_tasks_this_week)
        dev_breakdown.append({
            "user_id": dev.id,
            "username": dev.username,
            "full_name": dev.full_name,
            "role": dev.role,
            "dev_type": dev.dev_type,
            "total_seconds": total_secs,
            "total_hours": seconds_to_hours(total_secs),
            "task_count": task_count,
        })

    dev_breakdown.sort(key=lambda x: x["total_seconds"], reverse=True)

    # Track breakdown
    track_counts = {}
    for task in week_tasks:
        if task.track:
            track_counts[task.track] = track_counts.get(task.track, 0) + 1

    # Sum timer sessions + manual hours_logged (for excel imports with no sessions)
    session_seconds = sum(
        s.duration_seconds or 0
        for s in db.query(TaskSession).filter(
            TaskSession.started_at.between(week_start_dt, week_end_dt)
        ).all()
    )
    manual_seconds = sum(
        int(round(float(t.hours_logged) * 3600))
        for t in week_tasks
        if (t.hours_logged or 0) > 0 and t.total_seconds == 0
    )
    total_week_seconds = session_seconds + manual_seconds

    total_users = db.query(User).filter(User.is_active == True).count()

    return {
        "week_label": f"{week_start} to {week_end}",
        "kpis": {
            "total_users": total_users,
            "total_tasks_this_week": len(week_tasks),
            "completed_this_week": status_counts.get("completed", 0),
            "in_progress_this_week": status_counts.get("in_progress", 0),
            "total_hours_this_week": seconds_to_hours(total_week_seconds),
        },
        "status_breakdown": status_counts,
        "track_breakdown": track_counts,
        "developer_breakdown": dev_breakdown,
    }


@router.get("/reports")
def export_report_data(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    track: Optional[str] = None,
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
    if track:
        query = query.filter(TaskUpload.track == track)

    tasks = query.order_by(TaskUpload.created_at.desc()).all()

    total_seconds = sum(t.total_seconds or 0 for t in tasks)

    return {
        "total_tasks": len(tasks),
        "total_hours": seconds_to_hours(total_seconds),
        "avg_hours_per_task": seconds_to_hours(total_seconds // len(tasks)) if tasks else 0,
        "tasks": [
            {
                "ticket_id": t.ticket_id,
                "task_title": t.task_title,
                "track": t.track,
                "dev_type": t.dev_type_task,
                "type_of_development": t.type_of_development,
                "cd_number": t.cd_number,
                "functional_team": t.functional_team,
                "status": t.status,
                "priority": t.priority,
                "start_date": str(t.start_date) if t.start_date else None,
                "due_date": str(t.due_date) if t.due_date else None,
                "hours_logged": float(t.hours_logged or 0),
                "total_seconds": t.total_seconds,
                "upload_source": t.upload_source,
                "created_at": str(t.created_at),
            }
            for t in tasks
        ],
    }
