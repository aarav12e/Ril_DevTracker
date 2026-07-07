from datetime import datetime, date
from decimal import Decimal

class TaskUpload:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.ticket_id = kwargs.get("ticket_id")
        self.user_id = kwargs.get("user_id")
        self.task_title = kwargs.get("task_title")
        self.description = kwargs.get("description")
        self.status = kwargs.get("status", "in_progress")
        self.priority = kwargs.get("priority", "medium")
        
        s_date = kwargs.get("start_date")
        if isinstance(s_date, str):
            try:
                self.start_date = date.fromisoformat(s_date)
            except:
                self.start_date = None
        else:
            self.start_date = s_date

        d_date = kwargs.get("due_date")
        if isinstance(d_date, str):
            try:
                self.due_date = date.fromisoformat(d_date)
            except:
                self.due_date = None
        else:
            self.due_date = d_date

        c_at = kwargs.get("completed_at")
        if isinstance(c_at, str):
            try:
                self.completed_at = datetime.fromisoformat(c_at)
            except:
                self.completed_at = None
        else:
            self.completed_at = c_at

        self.hours_logged = Decimal(str(kwargs.get("hours_logged", 0.00)))
        self.file_name = kwargs.get("file_name")
        self.upload_source = kwargs.get("upload_source", "manual")
        self.track = kwargs.get("track")
        self.dev_type_task = kwargs.get("dev_type_task")
        self.type_of_development = kwargs.get("type_of_development")
        self.cd_number = kwargs.get("cd_number")
        self.functional_team = kwargs.get("functional_team")
        self.assigned_by = kwargs.get("assigned_by")
        self.total_seconds = kwargs.get("total_seconds", 0)
        self.timer_status = kwargs.get("timer_status", "idle")

        if self.timer_status == "active":
            try:
                from app.core.database import db
                # Find the open active session for this task
                open_session = db.task_sessions.find_one({
                    "task_id": self.id,
                    "ended_at": None
                })
                if open_session:
                    started_at = open_session.get("started_at")
                    if isinstance(started_at, str):
                        started_at = datetime.fromisoformat(started_at)
                    if started_at:
                        elapsed = int((datetime.utcnow() - started_at).total_seconds())
                        self.total_seconds += elapsed
            except Exception:
                pass

        self.upload_history_id = kwargs.get("upload_history_id")
        self.module = kwargs.get("module")
        self.category = kwargs.get("category")
        self.remarks = kwargs.get("remarks")

        created_at = kwargs.get("created_at")
        if isinstance(created_at, str):
            try:
                self.created_at = datetime.fromisoformat(created_at)
            except:
                self.created_at = datetime.utcnow()
        else:
            self.created_at = created_at or datetime.utcnow()

        updated_at = kwargs.get("updated_at")
        if isinstance(updated_at, str):
            try:
                self.updated_at = datetime.fromisoformat(updated_at)
            except:
                self.updated_at = datetime.utcnow()
        else:
            self.updated_at = updated_at or datetime.utcnow()

    @property
    def user(self):
        from app.core.database import db
        from app.models.user import User
        if not hasattr(self, "_user") or self._user is None:
            user_dict = db.users.find_one({"id": self.user_id})
            self._user = User(**user_dict) if user_dict else None
        return self._user

    @property
    def developer_name(self) -> str:
        return self.user.full_name or self.user.username if self.user else "System"

    @property
    def sessions(self):
        from app.core.database import db
        if not hasattr(self, "_sessions") or self._sessions is None:
            sess_list = list(db.task_sessions.find({"task_id": self.id}))
            self._sessions = [TaskSession(**s) for s in sess_list]
        return self._sessions

    def to_dict(self):
        return {
            "id": self.id,
            "ticket_id": self.ticket_id,
            "user_id": self.user_id,
            "task_title": self.task_title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "start_date": str(self.start_date) if isinstance(self.start_date, date) else self.start_date,
            "due_date": str(self.due_date) if isinstance(self.due_date, date) else self.due_date,
            "completed_at": self.completed_at,
            "hours_logged": float(self.hours_logged),
            "file_name": self.file_name,
            "upload_source": self.upload_source,
            "track": self.track,
            "dev_type_task": self.dev_type_task,
            "type_of_development": self.type_of_development,
            "cd_number": self.cd_number,
            "functional_team": self.functional_team,
            "assigned_by": self.assigned_by,
            "total_seconds": self.total_seconds,
            "timer_status": self.timer_status,
            "upload_history_id": self.upload_history_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "module": self.module,
            "category": self.category,
            "remarks": self.remarks,
        }


class TaskSession:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.task_id = kwargs.get("task_id")
        self.user_id = kwargs.get("user_id")
        self.session_number = kwargs.get("session_number", 1)
        
        started_at = kwargs.get("started_at")
        if isinstance(started_at, str):
            try:
                self.started_at = datetime.fromisoformat(started_at)
            except:
                self.started_at = datetime.utcnow()
        else:
            self.started_at = started_at or datetime.utcnow()

        paused_at = kwargs.get("paused_at")
        if isinstance(paused_at, str):
            try:
                self.paused_at = datetime.fromisoformat(paused_at)
            except:
                self.paused_at = None
        else:
            self.paused_at = paused_at

        ended_at = kwargs.get("ended_at")
        if isinstance(ended_at, str):
            try:
                self.ended_at = datetime.fromisoformat(ended_at)
            except:
                self.ended_at = None
        else:
            self.ended_at = ended_at

        self.duration_seconds = kwargs.get("duration_seconds", 0)

    @property
    def task(self):
        from app.core.database import db
        if not hasattr(self, "_task") or self._task is None:
            t_dict = db.task_uploads.find_one({"id": self.task_id})
            self._task = TaskUpload(**t_dict) if t_dict else None
        return self._task

    @property
    def user(self):
        from app.core.database import db
        from app.models.user import User
        if not hasattr(self, "_user") or self._user is None:
            u_dict = db.users.find_one({"id": self.user_id})
            self._user = User(**u_dict) if u_dict else None
        return self._user

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "user_id": self.user_id,
            "session_number": self.session_number,
            "started_at": self.started_at,
            "paused_at": self.paused_at,
            "ended_at": self.ended_at,
            "duration_seconds": self.duration_seconds,
        }
