from datetime import datetime, date


class Leave:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.user_id = kwargs.get("user_id")
        self.developer_name = kwargs.get("developer_name", "System")
        
        f_date = kwargs.get("from_date")
        if isinstance(f_date, str):
            try:
                self.from_date = date.fromisoformat(f_date)
            except:
                self.from_date = None
        else:
            self.from_date = f_date

        t_date = kwargs.get("to_date")
        if isinstance(t_date, str):
            try:
                self.to_date = date.fromisoformat(t_date)
            except:
                self.to_date = None
        else:
            self.to_date = t_date

        self.reason = kwargs.get("reason", "")
        self.total_days = kwargs.get("total_days", 0)

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
            "user_id": self.user_id,
            "developer_name": self.developer_name,
            "from_date": str(self.from_date) if isinstance(self.from_date, date) else self.from_date,
            "to_date": str(self.to_date) if isinstance(self.to_date, date) else self.to_date,
            "reason": self.reason,
            "total_days": self.total_days,
            "created_at": self.created_at,
        }
