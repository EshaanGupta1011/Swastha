from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime
from database import reports_collection, ReportCategory
from auth import get_current_user
from pdf_processor import process_pdf_with_gemini
import tempfile
import os
import mimetypes

router = APIRouter(prefix="/upload", tags=["upload"])

def is_allowed_file_type(content_type: str) -> bool:
    allowed_types = {"application/pdf", "image/jpeg", "image/png"}
    return content_type.lower() in allowed_types

@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    category: ReportCategory = Form(default=ReportCategory.GENERAL),
    current_user: dict = Depends(get_current_user)
):
    file_content_type = file.content_type
    if not is_allowed_file_type(file_content_type):
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_content_type}' not allowed. Only PDF, JPEG, and PNG files are permitted."
        )

    mime_to_suffix = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png"
    }
    temp_file_suffix = mime_to_suffix.get(file_content_type.lower(), "")

    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=temp_file_suffix) as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name

        extracted_data = process_pdf_with_gemini(temp_file_path)

        if extracted_data is None or (isinstance(extracted_data, dict) and "error" in extracted_data):
            return JSONResponse(
                content={
                    "message": "Failed to extract data from file",
                    "error": extracted_data.get("error", "Unknown error") if isinstance(extracted_data, dict) else "No data returned"
                },
                status_code=400
            )

        report_document = {
            "user_id": current_user["email"],
            "filename": file.filename,
            "extracted_data": extracted_data,
            "upload_date": datetime.utcnow(),
            "file_size": file.size,
            "category": category.value,
            "original_file_type": file_content_type
        }

        insert_result = reports_collection.insert_one(report_document)
        report_id = str(insert_result.inserted_id)

        return JSONResponse(
            content={
                "message": "File processed and data saved successfully",
                "report_id": report_id,
                "extracted_data": extracted_data,
                "category": category.value
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)