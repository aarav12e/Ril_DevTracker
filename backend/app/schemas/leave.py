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


class LeaveResponse(BaseModel):
    id: int
    user_id: int
    developer_name: str
    from_date: date
    to_date: date
    reason: str
    total_days: int
    created_at: datetime

    class Config:
        from_attributes = True
