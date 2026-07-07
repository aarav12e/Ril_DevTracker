from datetime import datetime

class User:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.username = kwargs.get("username")
        self.email = kwargs.get("email")
        self.password_hash = kwargs.get("password_hash")
        self.full_name = kwargs.get("full_name")
        self.role = kwargs.get("role")
        self.dev_type = kwargs.get("dev_type")
        self.domain = kwargs.get("domain")
        self.is_active = kwargs.get("is_active", True)
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
            "username": self.username,
            "email": self.email,
            "password_hash": self.password_hash,
            "full_name": self.full_name,
            "role": self.role,
            "dev_type": self.dev_type,
            "domain": self.domain,
            "is_active": self.is_active,
            "created_at": self.created_at,
        }
