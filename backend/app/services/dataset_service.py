from io import BytesIO
from pathlib import Path
from uuid import uuid4

import pandas as pd


UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def read_dataset(filename: str, content: bytes) -> pd.DataFrame:
    extension = filename.rsplit(".", 1)[-1].lower()

    if extension == "csv":
        return pd.read_csv(BytesIO(content))

    if extension in {"xlsx", "xls"}:
        return pd.read_excel(BytesIO(content))

    raise ValueError("Unsupported file type. Use CSV or Excel.")


def profile_dataset(df: pd.DataFrame) -> dict:
    numeric_columns = df.select_dtypes(
        include="number"
    ).columns.tolist()

    categorical_columns = df.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()

    missing_values = {
        column: int(count)
        for column, count in df.isna().sum().items()
        if count > 0
    }

    statistics = {}

    if numeric_columns:
        stats = df[numeric_columns].describe().round(2)

        statistics = {
            column: {
                "count": int(stats.loc["count", column]),
                "mean": float(stats.loc["mean", column]),
                "min": float(stats.loc["min", column]),
                "max": float(stats.loc["max", column]),
            }
            for column in numeric_columns
        }

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "missing_values": missing_values,
        "missing_cells": int(df.isna().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "statistics": statistics,
    }


def save_dataset(filename: str, content: bytes) -> str:
    dataset_id = str(uuid4())

    extension = filename.rsplit(".", 1)[-1].lower()

    file_path = UPLOAD_DIR / f"{dataset_id}.{extension}"

    file_path.write_bytes(content)

    return dataset_id


def get_dataset_path(dataset_id: str) -> Path:
    matches = list(UPLOAD_DIR.glob(f"{dataset_id}.*"))

    if not matches:
        raise FileNotFoundError("Dataset not found.")

    return matches[0]