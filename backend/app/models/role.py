from datetime import datetime

class Role:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.name = kwargs.get("name")
        self.permissions = kwargs.get("permissions")
        self.access_level = kwargs.get("access_level")
        created_at = kwargs.get("created_at")
        if isinstance(created_at, str):
            try:
                self.created_at = datetime.fromisoformat(created_at)
            except:
                self.created_at = datetime.utcnow()
        else:
            self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "permissions": self.permissions,
            "access_level": self.access_level,
            "created_at": self.created_at,
        }


class RolesConfig:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.role_name = kwargs.get("role_name")
        self.domain = kwargs.get("domain")
        self.upload_allowed = kwargs.get("upload_allowed", True)
        
        from datetime import date
        w_start = kwargs.get("upload_window_start")
        if isinstance(w_start, str):
            try:
                self.upload_window_start = date.fromisoformat(w_start)
            except:
                self.upload_window_start = None
        else:
            self.upload_window_start = w_start

        w_end = kwargs.get("upload_window_end")
        if isinstance(w_end, str):
            try:
                self.upload_window_end = date.fromisoformat(w_end)
            except:
                self.upload_window_end = None
        else:
            self.upload_window_end = w_end

        created_at = kwargs.get("created_at")
        if isinstance(created_at, str):
            try:
                self.created_at = datetime.fromisoformat(created_at)
            except:
                self.created_at = datetime.utcnow()
        else:
            self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        from datetime import date
        return {
            "id": self.id,
            "role_name": self.role_name,
            "domain": self.domain,
            "upload_allowed": self.upload_allowed,
            "upload_window_start": str(self.upload_window_start) if isinstance(self.upload_window_start, date) else self.upload_window_start,
            "upload_window_end": str(self.upload_window_end) if isinstance(self.upload_window_end, date) else self.upload_window_end,
            "created_at": self.created_at,
        }
