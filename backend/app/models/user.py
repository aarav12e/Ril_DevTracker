from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DevTypeEnum(str, enum.Enum):
    python = "python"
    angular = "angular"
    react = "react"
    node = "node"
    sap = "sap"
    other = "other"


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
