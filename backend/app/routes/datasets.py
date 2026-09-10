from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.dataset_service import (
    get_dataset_path,
    profile_dataset,
    read_dataset,
    save_dataset,
)

router = APIRouter()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided.",
        )

    extension = file.filename.rsplit(".", 1)[-1].lower()

    if extension not in {"csv", "xlsx", "xls"}:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported.",
        )

    try:
        content = await file.read()

        df = read_dataset(
            filename=file.filename,
            content=content,
        )

        dataset_id = save_dataset(
            filename=file.filename,
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
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "column_types": column_types,
            "preview": preview,
            "profile": profile,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to process dataset: {str(exc)}",
        )


@router.get("/{dataset_id}")
def get_dataset(dataset_id: str):
    try:
        dataset_path = get_dataset_path(dataset_id)

        content = dataset_path.read_bytes()

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
            "filename": dataset_path.name,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "column_types": column_types,
            "preview": preview,
            "profile": profile,
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to load dataset: {str(exc)}",
        )