from sqlalchemy import Column, Integer, String, DateTime, Date, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class TaskStatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    on_hold = "on_hold"
    fut = "fut"


class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TimerStatusEnum(str, enum.Enum):
    idle = "idle"
    active = "active"
    paused = "paused"
    completed = "completed"


class TrackEnum(str, enum.Enum):
    RFH = "RFH"


class TaskUpload(Base):
    __tablename__ = "task_uploads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Ticket system
    ticket_id = Column(String(10), unique=True, nullable=True)   # 5 chars alphanumeric

    # Task details
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

    # Extended fields
    track = Column(String(50), nullable=True)
    dev_type_task = Column(String(50), nullable=True)
    type_of_development = Column(String(100), nullable=True)
    cd_number = Column(String(50), nullable=True)
    functional_team = Column(String(100), nullable=True)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timer fields
    total_seconds = Column(Integer, default=0)
    timer_status = Column(String(20), default="idle")

    # Upload link
    upload_history_id = Column(Integer, ForeignKey("upload_history.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="tasks", foreign_keys=[user_id])
    assignor = relationship("User", foreign_keys=[assigned_by])
    sessions = relationship("TaskSession", back_populates="task", cascade="all, delete-orphan")
    upload_history = relationship("UploadHistory", back_populates="tasks")

    @property
    def developer_name(self) -> str:
        return self.user.full_name or self.user.username if self.user else "System"


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
