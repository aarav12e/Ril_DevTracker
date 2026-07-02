from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class RoleEnum(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    developer = "developer"
    intern = "intern"


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    permissions = Column(Text, nullable=False)          # JSON array as string
    access_level = Column(Integer, nullable=False)      # 1=intern,2=dev,3=mgr,4=admin
    created_at = Column(DateTime, server_default=func.now())


class RolesConfig(Base):
    __tablename__ = "roles_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), nullable=False)
    domain = Column(String(100), nullable=True)
    upload_allowed = Column(Boolean, default=True)
    upload_window_start = Column(Date, nullable=True)
    upload_window_end = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
