from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.core.database import get_db, get_next_sequence_value
from app.core.security import get_current_user, require_admin_or_manager
from app.models.leave import Leave
from app.schemas.leave import LeaveCreate, LeaveResponse

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])


def count_weekdays(start: date, end: date) -> int:
    days = 0
    curr = start
    while curr <= end:
        if curr.weekday() < 5:  # Mon=0 … Fri=4; Sat=5, Sun=6
            days += 1
        curr += timedelta(days=1)
    return days


# ── Apply for leave (developer / intern) ─────────────────────────────────────
@router.post("", response_model=LeaveResponse)
def apply_leave(
    payload: LeaveCreate,
    db = Depends(get_db),
    current_user = Depends(get_current_user),
):
    if payload.to_date < payload.from_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")

    total_days = count_weekdays(payload.from_date, payload.to_date)
    if total_days == 0:
        raise HTTPException(status_code=400, detail="Leave period cannot consist of weekends only")

    leave_id = get_next_sequence_value("leave_id")
    dev_name = current_user.full_name or current_user.username

    leave_item = Leave(
        id=leave_id,
        user_id=current_user.id,
        developer_name=dev_name,
        from_date=payload.from_date,
        to_date=payload.to_date,
        reason=payload.reason,
        total_days=total_days,
        created_at=datetime.utcnow()
    )

    db.leaves.insert_one(leave_item.to_dict())
    return leave_item


# ── My leaves ────────────────────────────────────────────────────────────────
@router.get("/my", response_model=List[LeaveResponse])
def get_my_leaves(
    db = Depends(get_db),
    current_user = Depends(get_current_user),
):
    cursor = db.leaves.find({"user_id": current_user.id}).sort("from_date", -1)
    return [Leave(**l) for l in cursor]


# ── All leaves (admin / manager) ─────────────────────────────────────────────
@router.get("", response_model=List[LeaveResponse])
def get_all_leaves(
    db = Depends(get_db),
    current_user = Depends(require_admin_or_manager),
):
    cursor = db.leaves.find().sort("created_at", -1)
    return [Leave(**l) for l in cursor]


# ── Delete a leave request ────────────────────────────────────────────────────
@router.delete("/{leave_id}")
def delete_leave(
    leave_id: int,
    db = Depends(get_db),
    current_user = Depends(get_current_user),
):
    leave_dict = db.leaves.find_one({"id": leave_id})
    if not leave_dict:
        raise HTTPException(status_code=404, detail="Leave record not found")

    # Developers can only delete their own leave requests
    if current_user.role not in ("admin", "manager") and leave_dict["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    db.leaves.delete_one({"id": leave_id})
    return {"message": "Leave record deleted successfully"}
