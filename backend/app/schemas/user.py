from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    full_name: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    full_name: Optional[str] = None
    role: str                           # admin | manager | developer | intern
    dev_type: str                       # python | angular | react | node | sap | other
    domain: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        allowed = {"admin", "manager", "developer", "intern"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v

    @field_validator("dev_type")
    @classmethod
    def validate_dev_type(cls, v):
        allowed = {"python", "angular", "react", "node", "sap", "other"}
        if v not in allowed:
            raise ValueError(f"dev_type must be one of {allowed}")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    dev_type: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    dev_type: str
    domain: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
