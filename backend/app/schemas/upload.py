from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UploadHistoryResponse(BaseModel):
    id: int
    uploaded_by: int
    week_label: Optional[str] = None
    sheet_name: Optional[str] = None
    original_filename: Optional[str] = None
    source: str
    total_rows: int
    valid_rows: int
    error_rows: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class UploadValidationResult(BaseModel):
    total_rows: int
    valid_rows: int
    error_rows: int
    duplicate_rows: int
    errors: List[dict]
    preview: List[dict]
