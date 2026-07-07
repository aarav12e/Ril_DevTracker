from datetime import datetime

class Notification:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.recipient_id = kwargs.get("recipient_id")
        self.triggered_by = kwargs.get("triggered_by")
        self.message = kwargs.get("message")
        self.notif_type = kwargs.get("notif_type", "upload")
        self.is_read = kwargs.get("is_read", False)
        
        created_at = kwargs.get("created_at")
        if isinstance(created_at, str):
            try:
                self.created_at = datetime.fromisoformat(created_at)
            except:
                self.created_at = datetime.utcnow()
        else:
            self.created_at = created_at or datetime.utcnow()

    @property
    def recipient(self):
        from app.core.database import db
        from app.models.user import User
        if not hasattr(self, "_recipient") or self._recipient is None:
            user_dict = db.users.find_one({"id": self.recipient_id})
            self._recipient = User(**user_dict) if user_dict else None
        return self._recipient

    @property
    def triggered_by_user(self):
        from app.core.database import db
        from app.models.user import User
        if not hasattr(self, "_triggered_by_user") or self._triggered_by_user is None:
            if self.triggered_by:
                user_dict = db.users.find_one({"id": self.triggered_by})
                self._triggered_by_user = User(**user_dict) if user_dict else None
            else:
                self._triggered_by_user = None
        return self._triggered_by_user

    def to_dict(self):
        return {
            "id": self.id,
            "recipient_id": self.recipient_id,
            "triggered_by": self.triggered_by,
            "message": self.message,
            "notif_type": self.notif_type,
            "is_read": self.is_read,
            "created_at": self.created_at,
        }
