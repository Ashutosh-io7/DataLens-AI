from typing import Any
from fastapi import APIRouter, File, HTTPException, UploadFile 
from pydantic import BaseModel 
from app.services.query_service import answer_question 
from app.services.dataset_service import (
    delete_dataset,
    get_dataset_metadata,
    get_dataset_path,
    list_dataset_metadata,
    profile_dataset,
    read_dataset,
    save_dataset,
)

from app.core.exceptions import (
    DatasetNotFoundError,
    InvalidDatasetError,
    UnsupportedFileTypeError,
)

router = APIRouter() 

class QueryRequest(BaseModel):
    question: str
    context: dict[str, Any] | None = None 


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided.",
        )

    extension = file.filename.rsplit(".", 1)[-1].lower()

    if extension not in {"csv", "xlsx", "xls"}:
        raise UnsupportedFileTypeError("Only CSV and Excel files are supported.") 

    try:
        content = await file.read()

        df = read_dataset(
            filename=file.filename,
            content=content,
        )

        metadata = save_dataset(
            filename=file.filename,
            content=content,
            rows = len(df),
            columns = len(df.columns), 
        )

        preview = (
            df.head(10)
            .fillna("")
            .to_dict(orient="records")
        )

        column_types = {
            column: str(dtype)
            for column, dtype in df.dtypes.items()
        }

        profile = profile_dataset(df)

        return {
            "dataset_id": metadata['dataset_id'],
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "column_types": column_types,
            "preview": preview,
            "profile": profile,
            "created_at": metadata['created_at'], 
        }

    except Exception as exc:
        raise InvalidDatasetError(f"Unable to process dataset: {str(exc)}")


@router.get("/{dataset_id}")
def get_dataset(dataset_id: str):
    try:
        dataset_path = get_dataset_path(dataset_id)

        content = dataset_path.read_bytes()

        metadata = get_dataset_metadata(dataset_id)

        df = read_dataset(
            filename=dataset_path.name,
            content=content,
        )

        preview = (
            df.head(10)
            .fillna("")
            .to_dict(orient="records")
        )

        column_types = {
            column: str(dtype)
            for column, dtype in df.dtypes.items()
        }

        profile = profile_dataset(df)

        return {
            "dataset_id": dataset_id,
            "filename": metadata['filename'],
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "column_types": column_types,
            "preview": preview,
            "profile": profile,
            "created_at": metadata['created_at'], 
        }

    except FileNotFoundError:
        raise DatasetNotFoundError("Dataset not found") 

    except Exception as exc:
        raise InvalidDatasetError(f"Unable to load dataset : {str(exc)}")  

@router.post("/{dataset_id}/query")
def query_dataset(
    dataset_id: str,
    request: QueryRequest,
):
    try:
        dataset_path = get_dataset_path(dataset_id)

        content = dataset_path.read_bytes()

        df = read_dataset(
            filename=dataset_path.name,
            content=content,
        )

        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty.",
            )

        result = answer_question(
            df,
            request.question,
            context=request.context,
        )

        return {
            "dataset_id": dataset_id,
            "question": request.question,
            **result,
        }

    except FileNotFoundError:
        raise DatasetNotFoundError("Dataset not found.")

    except HTTPException:
        raise

    except Exception as exc:
        raise InvalidDatasetError(f"Unable to analyze dataset: {str(exc)}")  

@router.delete("/{dataset_id}")
def remove_dataset(dataset_id: str):
    deleted = delete_dataset(dataset_id)
    if not deleted:
        raise DatasetNotFoundError("Dataset not found or could not be removed.")
    return {"message": "Dataset successfully deleted.", "dataset_id": dataset_id}

@router.get("")

def get_datasets() :
    return {
        "datasets" : list_dataset_metadata() 
    }