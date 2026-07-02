from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UploadSourceEnum(str, enum.Enum):
    manual = "manual"
    excel = "excel"


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
