from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    Text, Numeric, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


# ── Enums ──────────────────────────────────────────────────────
class RoleEnum(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    developer = "developer"
    intern = "intern"


class DevTypeEnum(str, enum.Enum):
    python = "python"
    angular = "angular"
    react = "react"
    node = "node"
    sap = "sap"
    other = "other"


class TaskStatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    on_hold = "on_hold"


class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class UploadSourceEnum(str, enum.Enum):
    manual = "manual"
    excel = "excel"


class TimerStatusEnum(str, enum.Enum):
    idle = "idle"
    active = "active"
    paused = "paused"
    completed = "completed"


class TrackEnum(str, enum.Enum):
    RFH = "RFH"
    BPL = "BPL"
    SAP = "SAP"
    NON_SAP = "NON_SAP"
    PROD = "PROD"
    MEETING = "MEETING"
    CODE_REVIEW = "CODE_REVIEW"
    RESEARCH = "RESEARCH"


# ── Users ──────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True)
    email = Column(String(255), nullable=True, unique=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=True)
    role = Column(String(50), nullable=False)          # FK by value to roles.name
    dev_type = Column(String(50), nullable=False)
    domain = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    tasks = relationship("TaskUpload", back_populates="user", foreign_keys="TaskUpload.user_id")
    uploads = relationship("UploadHistory", back_populates="uploader")
    timer_sessions = relationship("TaskSession", back_populates="user")
    notifications_received = relationship(
        "Notification", back_populates="recipient", foreign_keys="Notification.recipient_id"
    )
    notifications_triggered = relationship(
        "Notification", back_populates="triggered_by_user", foreign_keys="Notification.triggered_by"
    )


# ── Roles ──────────────────────────────────────────────────────
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    permissions = Column(Text, nullable=False)          # JSON array as string
    access_level = Column(Integer, nullable=False)      # 1=intern,2=dev,3=mgr,4=admin
    created_at = Column(DateTime, server_default=func.now())


# ── Task Uploads (core log table) ──────────────────────────────
class TaskUpload(Base):
    __tablename__ = "task_uploads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Ticket system
    ticket_id = Column(String(10), unique=True, nullable=True)   # DT-XXXXX

    # Task details (from DBML)
    task_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    priority = Column(String(20), default="medium")
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    hours_logged = Column(Numeric(10, 2), default=0.00)
    file_name = Column(String(255), nullable=True)
    upload_source = Column(String(20), default="manual")

    # Extended fields from our architecture
    track = Column(String(50), nullable=True)           # RFH, BPL, SAP, PROD etc.
    dev_type_task = Column(String(50), nullable=True)   # SAP, Non-SAP
    type_of_development = Column(String(100), nullable=True)
    cd_number = Column(String(50), nullable=True)
    functional_team = Column(String(100), nullable=True)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timer fields
    total_seconds = Column(Integer, default=0)
    timer_status = Column(String(20), default="idle")   # idle,active,paused,completed

    # Upload link
    upload_history_id = Column(Integer, ForeignKey("upload_history.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="tasks", foreign_keys=[user_id])
    assignor = relationship("User", foreign_keys=[assigned_by])
    sessions = relationship("TaskSession", back_populates="task", cascade="all, delete-orphan")
    upload_history = relationship("UploadHistory", back_populates="tasks")


# ── Task Sessions (timer engine) ───────────────────────────────
class TaskSession(Base):
    __tablename__ = "task_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task_uploads.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_number = Column(Integer, default=1)
    started_at = Column(DateTime, nullable=False)
    paused_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)

    task = relationship("TaskUpload", back_populates="sessions")
    user = relationship("User", back_populates="timer_sessions")


# ── Upload History ─────────────────────────────────────────────
class UploadHistory(Base):
    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_label = Column(String(100), nullable=True)
    sheet_name = Column(String(100), nullable=True)
    original_filename = Column(String(255), nullable=True)
    source = Column(String(20), default="excel")
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    uploaded_at = Column(DateTime, server_default=func.now())

    uploader = relationship("User", back_populates="uploads")
    tasks = relationship("TaskUpload", back_populates="upload_history")


# ── Notifications ──────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    message = Column(String(500), nullable=False)
    notif_type = Column(String(50), default="upload")   # upload, task, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    recipient = relationship("User", back_populates="notifications_received", foreign_keys=[recipient_id])
    triggered_by_user = relationship("User", back_populates="notifications_triggered", foreign_keys=[triggered_by])


# ── Roles Config (domain + upload window control) ──────────────
class RolesConfig(Base):
    __tablename__ = "roles_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), nullable=False)
    domain = Column(String(100), nullable=True)
    upload_allowed = Column(Boolean, default=True)
    upload_window_start = Column(Date, nullable=True)
    upload_window_end = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
