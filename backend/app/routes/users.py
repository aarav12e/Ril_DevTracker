from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.database import get_db, get_next_sequence_value
from app.core.security import get_current_user, require_admin, require_admin_or_manager, hash_password
from app.models import User
from app.schemas import UserCreate, UserUpdate, UserResponse
from app.core.config import settings

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db = Depends(get_db),
    _=Depends(require_admin_or_manager),
):
    filt = {}
    if role:
        filt["role"] = role
    if is_active is not None:
        filt["is_active"] = is_active
        
    cursor = db.users.find(filt).sort("created_at", -1)
    return [User(**u) for u in cursor]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Users can only view themselves unless admin/manager
    if current_user.role not in ("admin", "manager") and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user_dict = db.users.find_one({"id": user_id})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_dict)


@router.post("", response_model=UserResponse)
def create_user(
    payload: UserCreate,
    db = Depends(get_db),
    _=Depends(require_admin),
):
    if payload.email:
        domain = payload.email.split("@")[-1]
        if domain not in settings.allowed_domain_list:
            raise HTTPException(status_code=400, detail=f"Domain @{domain} not allowed")

    if db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = get_next_sequence_value("user_id")
    user = User(
        id=user_id,
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        dev_type=payload.dev_type,
        domain=payload.email.split("@")[-1] if payload.email else payload.domain,
    )
    db.users.insert_one(user.to_dict())
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db = Depends(get_db),
    _=Depends(require_admin),
):
    user_dict = db.users.find_one({"id": user_id})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_none=True)
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    if update_data:
        db.users.update_one({"id": user_id}, {"$set": update_data})
        user_dict.update(update_data)

    return User(**user_dict)


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    db = Depends(get_db),
    current_user=Depends(require_admin),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user_dict = db.users.find_one({"id": user_id})
    if not user_dict:
        raise HTTPException(status_code=404, detail="User not found")

    db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    return {"message": f"User '{user_dict['username']}' deactivated successfully"}
