from datetime import datetime
from app.core.database import get_next_sequence_value
from app.models.notification import Notification

def notify_admins(db, message: str, triggered_by: int, notif_type: str = "upload"):
    """Create a notification for all active admins."""
    cursor = db.users.find({"role": "admin", "is_active": True})
    for admin in cursor:
        notif_id = get_next_sequence_value("notification_id")
        notif = Notification(
            id=notif_id,
            recipient_id=admin["id"],
            triggered_by=triggered_by,
            message=message,
            notif_type=notif_type,
        )
        db.notifications.insert_one(notif.to_dict())


def seconds_to_hours(seconds: int) -> float:
    return round(seconds / 3600, 2)


def is_upload_window_open(db, role: str) -> bool:
    """Check if upload window is currently open for this role."""
    from app.models.role import RolesConfig
    config_dict = db.roles_config.find_one({"role_name": role})
    if not config_dict:
        return True  # No restriction set = always open
    config = RolesConfig(**config_dict)
    if not config.upload_window_start or not config.upload_window_end:
        return True
    from datetime import date
    today = date.today()
    return config.upload_window_start <= today <= config.upload_window_end
