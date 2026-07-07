from datetime import datetime

class UploadHistory:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.uploaded_by = kwargs.get("uploaded_by")
        self.week_label = kwargs.get("week_label")
        self.sheet_name = kwargs.get("sheet_name")
        self.original_filename = kwargs.get("original_filename")
        self.source = kwargs.get("source", "excel")
        self.total_rows = kwargs.get("total_rows", 0)
        self.valid_rows = kwargs.get("valid_rows", 0)
        self.error_rows = kwargs.get("error_rows", 0)
        
        uploaded_at = kwargs.get("uploaded_at")
        if isinstance(uploaded_at, str):
            try:
                self.uploaded_at = datetime.fromisoformat(uploaded_at)
            except:
                self.uploaded_at = datetime.utcnow()
        else:
            self.uploaded_at = uploaded_at or datetime.utcnow()

    @property
    def uploader(self):
        from app.core.database import db
        from app.models.user import User
        if not hasattr(self, "_uploader") or self._uploader is None:
            user_dict = db.users.find_one({"id": self.uploaded_by})
            self._uploader = User(**user_dict) if user_dict else None
        return self._uploader

    def to_dict(self):
        return {
            "id": self.id,
            "uploaded_by": self.uploaded_by,
            "week_label": self.week_label,
            "sheet_name": self.sheet_name,
            "original_filename": self.original_filename,
            "source": self.source,
            "total_rows": self.total_rows,
            "valid_rows": self.valid_rows,
            "error_rows": self.error_rows,
            "uploaded_at": self.uploaded_at,
        }
