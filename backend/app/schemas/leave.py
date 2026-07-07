from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional


class LeaveCreate(BaseModel):
    from_date: date
    to_date: date
    reason: str

    @field_validator("to_date")
    @classmethod
    def validate_dates(cls, v, info):
        from_date = info.data.get("from_date")
        if from_date and v < from_date:
            raise ValueError("to_date cannot be before from_date")
        return v


class LeaveStatusUpdate(BaseModel):
    status: str  # "approved" | "rejected"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in {"approved", "rejected"}:
            raise ValueError("status must be 'approved' or 'rejected'")
        return v


class LeaveResponse(BaseModel):
    id: int
    user_id: int
    developer_name: str
    from_date: date
    to_date: date
    reason: str
    total_days: int
    status: str = "pending"
    reviewed_by: Optional[int] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
