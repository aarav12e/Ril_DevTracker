from pydantic import BaseModel
from typing import Optional
from datetime import datetime


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
