from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from uuid import uuid4
import json 
import math 
import pandas as pd 

from app.core.config import settings 
from app.core.database import SessionLocal
from app.models.dataset import Dataset

settings.upload_dir.mkdir(parents=True, exist_ok=True) 
settings.metadata_dir.mkdir(parents=True, exist_ok=True) 


def read_dataset(filename: str, content: bytes) -> pd.DataFrame:
    extension = filename.rsplit(".", 1)[-1].lower()

    if extension == "csv":
        return pd.read_csv(BytesIO(content))

    if extension in {"xlsx", "xls"}:
        return pd.read_excel(BytesIO(content))

    raise ValueError("Unsupported file type. Use CSV or Excel.")


def _finite(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return round(number, 2) if math.isfinite(number) else None


def _infer_semantic_type(series: pd.Series, column: str) -> str:
    non_null = series.dropna()
    if non_null.empty:
        return "text"

    unique_ratio = non_null.nunique() / len(non_null)

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if not pd.api.types.is_numeric_dtype(series):
        sample = non_null.astype(str).head(200)
        try:
            parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
            if parsed.notna().mean() >= 0.8:
                return "datetime"
        except (ValueError, TypeError):
            pass

    if pd.api.types.is_numeric_dtype(series):
        name = column.lower()
        looks_like_id = name in {"id", "index"} or name.endswith(("_id", "_key"))
        if looks_like_id and unique_ratio > 0.95:
            return "identifier"
        return "numeric"

    if unique_ratio > 0.95 and len(non_null) > 20:
        avg_length = non_null.astype(str).str.len().mean()
        return "text" if avg_length >= 40 else "identifier"

    if non_null.astype(str).str.len().mean() >= 40:
        return "text"

    return "categorical"


def _count_outliers(numeric: pd.Series) -> int:
    if numeric.size < 4:
        return 0
    q1, q3 = numeric.quantile(0.25), numeric.quantile(0.75)
    iqr = q3 - q1
    if not math.isfinite(iqr) or iqr == 0:
        return 0
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return int(((numeric < lower) | (numeric > upper)).sum())


def profile_dataset(df: pd.DataFrame) -> dict:
    numeric_columns = df.select_dtypes(include="number").columns.tolist()
    categorical_columns = df.select_dtypes(include=["object", "category"]).columns.tolist()

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

    semantic_types = {col: _infer_semantic_type(df[col], col) for col in df.columns}
    datetime_columns = [c for c, t in semantic_types.items() if t == "datetime"]

    column_profiles = {}
    for column in df.columns:
        series = df[column]
        semantic = semantic_types[column]
        entry = {"semantic_type": semantic}

        if semantic == "numeric":
            numeric = pd.to_numeric(series, errors="coerce").dropna()
            if not numeric.empty:
                entry["median"] = _finite(numeric.median())
                entry["std"] = _finite(numeric.std())
                entry["skew"] = _finite(numeric.skew())
                entry["outlier_count"] = _count_outliers(numeric)

        elif semantic == "categorical":
            cleaned = series.dropna().astype(str).str.strip()
            if not cleaned.empty:
                top = cleaned.value_counts().head(5)
                entry["top_values"] = [
                    {"label": str(label), "count": int(count)}
                    for label, count in top.items()
                ]

        column_profiles[column] = entry

    row_count = max(len(df), 1)
    cell_count = max(row_count * len(df.columns), 1)
    missing_cells = int(df.isna().sum().sum())
    missing_percent = missing_cells / cell_count * 100
    duplicate_rows = int(df.duplicated().sum())
    constant_columns = [c for c in df.columns if df[c].nunique(dropna=True) <= 1]

    score = 100.0
    issues = []

    if missing_percent > 0:
        score -= min(missing_percent * 0.6, 30.0)
        issues.append(f"{missing_percent:.1f}% of all cells are empty.")

    if duplicate_rows > 0:
        dup_percent = duplicate_rows / row_count * 100
        score -= min(dup_percent * 2, 20.0)
        issues.append(f"{duplicate_rows:,} duplicate rows ({dup_percent:.1f}%).")

    if constant_columns:
        score -= min(len(constant_columns) * 3, 15.0)
        issues.append(f"Columns with only one repeated value: {', '.join(constant_columns[:5])}.")

    skewed = [c for c, p in column_profiles.items() if p.get("skew") is not None and abs(p["skew"]) > 2]
    if skewed:
        score -= min(len(skewed) * 2, 10.0)
        issues.append(f"Strongly skewed numeric columns: {', '.join(skewed[:5])}.")

    if not issues:
        issues.append("No significant data quality problems detected.")

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "missing_values": missing_values,
        "missing_cells": missing_cells,
        "duplicate_rows": duplicate_rows,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "datetime_columns": datetime_columns,
        "statistics": statistics,
        "column_profiles": column_profiles,
        "quality_score": round(max(score, 0.0), 1),
        "quality_issues": issues,
    }


def save_dataset(
    filename: str,
    content: bytes,
    rows: int,
    columns: int,
    quality_score: float | None = None,
    profile: dict | None = None,
) -> dict:
    dataset_id = str(uuid4())
    extension = filename.rsplit(".", 1)[-1].lower()

    # 1. Save file to disk
    file_path = settings.upload_dir / f"{dataset_id}.{extension}"
    metadata_path = settings.metadata_dir / f"{dataset_id}.json"
    file_path.write_bytes(content)

    created_iso = datetime.now(timezone.utc).isoformat()

    metadata = {
        "dataset_id": dataset_id,
        "filename": filename,
        "extension": extension,
        "rows": rows,
        "columns": columns,
        "size_bytes": len(content),
        "quality_score": quality_score,
        "created_at": created_iso,
    }

    metadata_path.write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )

    # 2. Persist to PostgreSQL if database is active
    try:
        db = SessionLocal()
        try:
            db_dataset = Dataset(
                id=dataset_id,
                filename=filename,
                extension=extension,
                rows=rows,
                columns=columns,
                size_bytes=len(content),
                quality_score=quality_score,
                profile=profile,
            )
            db.add(db_dataset)
            db.commit()
        finally:
            db.close()
    except Exception:
        # Fallback continues without crashing if DB connection is intermittent
        pass

    return metadata


def get_dataset_path(dataset_id: str) -> Path:
    matches = list(settings.upload_dir.glob(f"{dataset_id}.*"))
    if not matches:
        raise FileNotFoundError("Dataset not found.")
    return matches[0]


def get_dataset_metadata(dataset_id: str) -> dict:
    # Check database first, fallback to JSON
    try:
        db = SessionLocal()
        try:
            db_dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if db_dataset:
                return db_dataset.to_dict()
        finally:
            db.close()
    except Exception:
        pass

    metadata_path = settings.metadata_dir / f"{dataset_id}.json"
    if not metadata_path.exists():
        raise FileNotFoundError("Dataset metadata not found.")
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def list_dataset_metadata() -> list[dict]:
    # Check database first
    try:
        db = SessionLocal()
        try:
            db_datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
            if db_datasets:
                return [d.to_dict() for d in db_datasets]
        finally:
            db.close()
    except Exception:
        pass

    # Filesystem fallback
    datasets = []
    for metadata_path in settings.metadata_dir.glob("*.json"):
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            datasets.append(metadata)
        except (json.JSONDecodeError, OSError):
            continue

    datasets.sort(
        key=lambda dataset: dataset.get("created_at", ""),
        reverse=True,
    )
    return datasets


def delete_dataset(dataset_id: str) -> bool:
    # Remove from database
    try:
        db = SessionLocal()
        try:
            db_dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if db_dataset:
                db.delete(db_dataset)
                db.commit()
        finally:
            db.close()
    except Exception:
        pass

    # Remove files from disk
    deleted = False
    for path in settings.upload_dir.glob(f"{dataset_id}.*"):
        try:
            path.unlink(missing_ok=True)
            deleted = True
        except OSError:
            pass

    metadata_path = settings.metadata_dir / f"{dataset_id}.json"
    if metadata_path.exists():
        try:
            metadata_path.unlink(missing_ok=True)
            deleted = True
        except OSError:
            pass

    return deleted
