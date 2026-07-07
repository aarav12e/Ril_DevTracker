from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class TaskCreate(BaseModel):
    task_title: str
    description: Optional[str] = None
    priority: str = "medium"
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    track: Optional[str] = None
    dev_type_task: Optional[str] = None
    type_of_development: Optional[str] = None
    cd_number: Optional[str] = None
    functional_team: Optional[str] = None
    assigned_by: Optional[int] = None
    hours_logged: Optional[float] = None
    total_seconds: Optional[int] = None
    module: Optional[str] = None
    category: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        if v not in {"low", "medium", "high"}:
            raise ValueError("priority must be low, medium, or high")
        return v

    @field_validator("track")
    @classmethod
    def validate_track(cls, v):
        if v is None:
            return v
        allowed = {"RFH"}
        if v not in allowed:
            raise ValueError(f"track must be one of {allowed}")
        return v


class TaskUpdate(BaseModel):
    task_title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    track: Optional[str] = None
    type_of_development: Optional[str] = None
    cd_number: Optional[str] = None
    functional_team: Optional[str] = None
    dev_type_task: Optional[str] = None
    start_date: Optional[date] = None
    hours_logged: Optional[float] = None
    total_seconds: Optional[int] = None
    module: Optional[str] = None
    category: Optional[str] = None
    remarks: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    ticket_id: Optional[str] = None
    user_id: int
    developer_name: Optional[str] = None
    task_title: str
    description: Optional[str] = None
    status: str
    priority: str
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    hours_logged: Optional[Decimal] = None
    file_name: Optional[str] = None
    upload_source: str
    track: Optional[str] = None
    dev_type_task: Optional[str] = None
    type_of_development: Optional[str] = None
    cd_number: Optional[str] = None
    functional_team: Optional[str] = None
    assigned_by: Optional[int] = None
    total_seconds: int
    timer_status: str
    created_at: datetime
    updated_at: datetime
    module: Optional[str] = None
    category: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class TimerActionResponse(BaseModel):
    task_id: int
    ticket_id: Optional[str]
    timer_status: str
    total_seconds: int
    message: str
    session_id: Optional[int] = None


class TimerStatusResponse(BaseModel):
    task_id: int
    ticket_id: Optional[str]
    task_title: str
    timer_status: str
    total_seconds: int
    current_session_seconds: int
    sessions_count: int
