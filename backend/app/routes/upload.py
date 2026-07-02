from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
import pandas as pd

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.upload import UploadHistory
from app.schemas.upload import UploadHistoryResponse, UploadValidationResult
from app.services.utils import is_upload_window_open
from app.services.excel_service import validate_excel_workbook, import_excel_workbook

router = APIRouter(prefix="/api/upload", tags=["Excel Upload"])


@router.post("/excel", response_model=UploadHistoryResponse)
async def upload_excel(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    week_label: Optional[str] = Form(None),
    skip_duplicates: bool = Form(True),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Upload window check
    if not is_upload_window_open(db, current_user.role):
        raise HTTPException(status_code=403, detail="Upload window is currently closed for your role")

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are allowed")

    contents = await file.read()

    try:
        history = import_excel_workbook(
            db=db,
            file_name=file.filename,
            file_contents=contents,
            sheet_name=sheet_name,
            week_label=week_label,
            skip_duplicates=skip_duplicates,
            current_user=current_user,
        )
        return history
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read/process Excel file: {str(e)}")


@router.get("/history", response_model=list[UploadHistoryResponse])
def upload_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(UploadHistory)
    if current_user.role in ("developer", "intern"):
        query = query.filter(UploadHistory.uploaded_by == current_user.id)
    return query.order_by(UploadHistory.uploaded_at.desc()).limit(50).all()


@router.post("/validate", response_model=UploadValidationResult)
async def validate_excel(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Dry-run: validate without importing. Returns errors + preview."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files allowed")

    contents = await file.read()
    try:
        result = validate_excel_workbook(
            db=db,
            file_contents=contents,
            sheet_name=sheet_name,
            current_user=current_user,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/template")
def download_template():
    """Download the standard Excel upload template."""
    df = pd.DataFrame(columns=[
        "Track", "Dev Type", "Type of Development", "CD",
        "Development Subject", "Functional Team", "Developers",
        "Start Date", "End Date", "Time (Min)", "Status", "Remarks"
    ])
    # Add sample row
    df.loc[0] = [
        "RFH", "SAP", "Development", "8089020",
        "BPL Case Discount SOA and Invoice Print", "Biswajit", "Priya Dev",
        "2026-06-01", "2026-06-05", "150", "in_progress", "SAP discount module fix"
    ]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="01_Week_Template")
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=devtracker_template.xlsx"},
    )
