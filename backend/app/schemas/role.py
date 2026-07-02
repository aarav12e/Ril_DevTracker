from pydantic import BaseModel
from datetime import datetime


class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: str
    access_level: int
    created_at: datetime

    class Config:
        from_attributes = True
