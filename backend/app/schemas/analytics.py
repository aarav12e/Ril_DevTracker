from pydantic import BaseModel
from typing import Optional, List
from app.schemas.task import TaskResponse


class DashboardStats(BaseModel):
    total_tasks: int
    completed_today: int
    wip_tasks: int
    total_hours_today: float
    active_task: Optional[TaskResponse] = None


class DeveloperDailyBreakdown(BaseModel):
    task_id: int
    ticket_id: Optional[str]
    task_title: str
    seconds_today: int
    status: str


class AdminAnalytics(BaseModel):
    total_users: int
    total_tasks_this_week: int
    completed_this_week: int
    total_hours_this_week: float
    developer_breakdown: List[dict]
    status_breakdown: dict
