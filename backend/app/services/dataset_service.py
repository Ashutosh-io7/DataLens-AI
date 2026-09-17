from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from uuid import uuid4
import json 
from app.core.config import settings 

import pandas as pd 
import math 


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
    """Convert to a plain float, or None if it's NaN/infinite."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _infer_semantic_type(series: pd.Series, column: str) -> str:
    """Figure out what a column actually represents, not just its dtype."""
    non_null = series.dropna()
    if non_null.empty:
        return "text"

    unique_ratio = non_null.nunique() / len(non_null)

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    # Try parsing as dates before checking numeric — dates stored as text
    # would otherwise get treated as plain categories.
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

    # Almost every value is unique -> likely an ID or free text, not a category
    if unique_ratio > 0.95 and len(non_null) > 20:
        avg_length = non_null.astype(str).str.len().mean()
        return "text" if avg_length >= 40 else "identifier"

    if non_null.astype(str).str.len().mean() >= 40:
        return "text"

    return "categorical"


def _count_outliers(numeric: pd.Series) -> int:
    """Tukey's rule: flag anything more than 1.5x the interquartile range away."""
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

    # --- New: classify every column by what it actually represents ---
    semantic_types = {col: _infer_semantic_type(df[col], col) for col in df.columns}
    datetime_columns = [c for c, t in semantic_types.items() if t == "datetime"]

    # --- New: per-column deep profile (outliers, spread, top values) ---
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

    # --- New: quality score, 0-100, with plain-English reasons ---
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
) -> dict:
    dataset_id = str(uuid4())

    extension = filename.rsplit(".", 1)[-1].lower()

    file_path = settings.upload_dir / f"{dataset_id}.{extension}"
    metadata_path = settings.metadata_dir / f"{dataset_id}.json"

    file_path.write_bytes(content)

    metadata = {
        "dataset_id": dataset_id,
        "filename": filename,
        "extension": extension,
        "rows": rows,
        "columns": columns,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    metadata_path.write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )

    return metadata


def get_dataset_path(dataset_id: str) -> Path:
    matches = list(settings.upload_dir.glob(f"{dataset_id}.*"))

    if not matches:
        raise FileNotFoundError("Dataset not found.")

    return matches[0]


def get_dataset_metadata(dataset_id: str) -> dict:
    metadata_path = settings.metadata_dir / f"{dataset_id}.json"

    if not metadata_path.exists():
        raise FileNotFoundError("Dataset metadata not found.")

    return json.loads(
        metadata_path.read_text(encoding="utf-8")
    )


def list_dataset_metadata() -> list[dict]:
    datasets = []

    for metadata_path in settings.metadata_dir.glob("*.json"):
        try:
            metadata = json.loads(
                metadata_path.read_text(encoding="utf-8")
            )
            datasets.append(metadata)
        except (json.JSONDecodeError, OSError):
            continue

    datasets.sort(
        key=lambda dataset: dataset.get("created_at", ""),
        reverse=True,
    )

    return datasets