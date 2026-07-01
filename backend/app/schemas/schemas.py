from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


# ══════════════════════════════════════════
#  AUTH SCHEMAS
# ══════════════════════════════════════════
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    full_name: Optional[str] = None


# ══════════════════════════════════════════
#  USER SCHEMAS
# ══════════════════════════════════════════
class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    full_name: Optional[str] = None
    role: str                           # admin | manager | developer | intern
    dev_type: str                       # python | angular | react | node | sap | other
    domain: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        allowed = {"admin", "manager", "developer", "intern"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v

    @field_validator("dev_type")
    @classmethod
    def validate_dev_type(cls, v):
        allowed = {"python", "angular", "react", "node", "sap", "other"}
        if v not in allowed:
            raise ValueError(f"dev_type must be one of {allowed}")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    dev_type: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    dev_type: str
    domain: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ══════════════════════════════════════════
#  ROLE SCHEMAS
# ══════════════════════════════════════════
class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: str
    access_level: int
    created_at: datetime

    class Config:
        from_attributes = True


# ══════════════════════════════════════════
#  TASK SCHEMAS
# ══════════════════════════════════════════
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
        allowed = {"RFH", "BPL", "SAP", "NON_SAP", "PROD", "MEETING", "CODE_REVIEW", "RESEARCH"}
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


class TaskResponse(BaseModel):
    id: int
    ticket_id: Optional[str] = None
    user_id: int
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

    class Config:
        from_attributes = True


# ══════════════════════════════════════════
#  TIMER SCHEMAS
# ══════════════════════════════════════════
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


# ══════════════════════════════════════════
#  UPLOAD SCHEMAS
# ══════════════════════════════════════════
class UploadHistoryResponse(BaseModel):
    id: int
    uploaded_by: int
    week_label: Optional[str] = None
    sheet_name: Optional[str] = None
    original_filename: Optional[str] = None
    source: str
    total_rows: int
    valid_rows: int
    error_rows: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class UploadValidationResult(BaseModel):
    total_rows: int
    valid_rows: int
    error_rows: int
    duplicate_rows: int
    errors: List[dict]
    preview: List[dict]


# ══════════════════════════════════════════
#  NOTIFICATION SCHEMAS
# ══════════════════════════════════════════
class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    triggered_by: Optional[int] = None
    message: str
    notif_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ══════════════════════════════════════════
#  DASHBOARD / ANALYTICS SCHEMAS
# ══════════════════════════════════════════
class DashboardStats(BaseModel):
    total_tasks: int
    completed_today: int
    wip_tasks: int
    total_hours_today: float
    active_task: Optional[TaskResponse] = None


class DeveloperDailyBreakdown(BaseModel):
    task_id: int
    ticket_id: Optional[str]
    task_title: str
    seconds_today: int
    status: str


class AdminAnalytics(BaseModel):
    total_users: int
    total_tasks_this_week: int
    completed_this_week: int
    total_hours_this_week: float
    developer_breakdown: List[dict]
    status_breakdown: dict
