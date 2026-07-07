from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Notification
from app.schemas import NotificationResponse
from typing import List

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    filt = {"recipient_id": current_user.id}
    if unread_only:
        filt["is_read"] = False
    cursor = db.notifications.find(filt).sort("created_at", -1).limit(50)
    return [Notification(**n) for n in cursor]


@router.patch("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notif_dict = db.notifications.find_one({
        "id": notif_id,
        "recipient_id": current_user.id,
    })
    if not notif_dict:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.notifications.update_one({"id": notif_id}, {"$set": {"is_read": True}})
    return {"message": "Marked as read"}


@router.patch("/read-all")
def mark_all_read(
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db.notifications.update_many(
        {"recipient_id": current_user.id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
def unread_count(
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    count = db.notifications.count_documents({
        "recipient_id": current_user.id,
        "is_read": False,
    })
    return {"unread_count": count}
