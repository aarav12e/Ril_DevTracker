import random
import string
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import TaskUpload, Notification, User


def generate_ticket_id(db: Session) -> str:
    """Generate a unique DT-XXXXX ticket ID."""
    while True:
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        ticket = f"DT-{suffix}"
        exists = db.query(TaskUpload).filter(TaskUpload.ticket_id == ticket).first()
        if not exists:
            return ticket


def notify_admins(db: Session, message: str, triggered_by: int, notif_type: str = "upload"):
    """Create a notification for all active admins."""
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    for admin in admins:
        notif = Notification(
            recipient_id=admin.id,
            triggered_by=triggered_by,
            message=message,
            notif_type=notif_type,
        )
        db.add(notif)
    db.commit()


def seconds_to_hours(seconds: int) -> float:
    return round(seconds / 3600, 2)


def is_upload_window_open(db: Session, role: str) -> bool:
    """Check if upload window is currently open for this role."""
    from app.models.models import RolesConfig
    config = db.query(RolesConfig).filter(RolesConfig.role_name == role).first()
    if not config or not config.upload_window_start or not config.upload_window_end:
        return True  # No restriction set = always open
    today = datetime.utcnow().date()
    return config.upload_window_start <= today <= config.upload_window_end
