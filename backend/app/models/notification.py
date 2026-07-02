from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


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
