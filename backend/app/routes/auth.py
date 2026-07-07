from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_db, get_next_sequence_value
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin
)
from app.core.config import settings
from app.models import User, Role
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db = Depends(get_db)):
    user_dict = db.users.find_one({"username": payload.username})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    user = User(**user_dict)
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
    )


@router.post("/register", response_model=UserResponse)
def register(payload: UserCreate, db = Depends(get_db)):
    # Domain validation
    if payload.email:
        domain = payload.email.split("@")[-1]
        if domain not in settings.allowed_domain_list:
            raise HTTPException(
                status_code=400,
                detail=f"Email domain @{domain} is not allowed. "
                       f"Permitted domains: {settings.allowed_domain_list}",
            )

    # Duplicate check
    if db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    if payload.email and db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Role exists check
    role_obj = db.roles.find_one({"name": payload.role})
    if not role_obj:
        raise HTTPException(status_code=400, detail=f"Role '{payload.role}' not found")

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


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user
