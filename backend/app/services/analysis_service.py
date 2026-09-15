from __future__ import annotations

import math
import re
from typing import Any

import pandas as pd

from app.services.visualization_service import (
    category_count_chart,
    choose_value_counts_chart,
    grouped_chart,
    histogram_chart,
    missing_values_chart,
    scatter_chart,
    value_counts_chart,
)


AGGREGATIONS = {
    "average": "mean",
    "avg": "mean",
    "mean": "mean",
    "minimum": "min",
    "min": "min",
    "lowest": "min",
    "maximum": "max",
    "max": "max",
    "highest": "max",
    "sum": "sum",
    "total": "sum",
    "median": "median",
}


def normalize_text(value: str) -> str:
    return re.sub(
        r"[^a-z0-9]+",
        " ",
        value.lower(),
    ).strip()


def find_column(
    df: pd.DataFrame,
    question: str,
) -> str | None:
    normalized_question = normalize_text(question)

    matches = []

    for column in df.columns:
        normalized_column = normalize_text(str(column))

        if (
            normalized_column
            and normalized_column in normalized_question
        ):
            matches.append(
                (
                    len(normalized_column),
                    column,
                )
            )

    if matches:
        matches.sort(reverse=True)
        return matches[0][1]

    aliases = {
        "release_year": [
            "year",
            "release year",
            "released",
        ],
        "type": [
            "type",
            "content type",
            "kind",
        ],
        "rating": [
            "rating",
            "ratings",
            "age rating",
        ],
        "country": [
            "country",
            "countries",
            "nation",
        ],
    }

    for column in df.columns:
        normalized_column = normalize_text(
            str(column)
        )

        for canonical, names in aliases.items():
            if normalized_column == canonical.replace(
                "_",
                " ",
            ):
                if any(
                    name in normalized_question
                    for name in names
                ):
                    return column

    return None


def _safe_number(value: Any) -> int | float | None:
    if pd.isna(value):
        return None

    numeric = float(value)

    if not math.isfinite(numeric):
        return None

    if numeric.is_integer():
        return int(numeric)

    return numeric


def _extract_top_n(
    question: str,
    default: int = 5,
) -> int:
    match = re.search(
        r"\btop\s+(\d+)\b",
        question.lower(),
    )

    if not match:
        return default

    return max(
        1,
        min(
            int(match.group(1)),
            20,
        ),
    )


def _is_temporal(
    series: pd.Series,
    column: str,
) -> bool:
    normalized = normalize_text(column)

    return (
        "year" in normalized
        or "date" in normalized
        or "time" in normalized
        or pd.api.types.is_datetime64_any_dtype(series)
    )


def _aggregate(
    series: pd.Series,
    operation: str,
) -> float:
    numeric = pd.to_numeric(
        series,
        errors="coerce",
    ).dropna()

    if numeric.empty:
        raise ValueError(
            "Column does not contain numeric values."
        )

    return float(
        getattr(numeric, operation)()
    )


def analyze_question(
    df: pd.DataFrame,
    question: str,
) -> dict[str, Any]:
    q = question.strip().lower()

    if not q:
        return {
            "answer": "Please enter a question about your dataset.",
            "analysis_type": "invalid",
        }

    # Dataset size
    if any(
        phrase in q
        for phrase in (
            "how many rows",
            "how many records",
            "how many entries",
            "number of rows",
            "number of records",
        )
    ):
        count = len(df)

        return {
            "answer": (
                f"There are {count:,} records "
                "in the dataset."
            ),
            "analysis_type": "row_count",
            "value": count,
        }

    if any(
        phrase in q
        for phrase in (
            "how many columns",
            "number of columns",
        )
    ):
        count = len(df.columns)

        return {
            "answer": (
                f"The dataset has {count} columns."
            ),
            "analysis_type": "column_count",
            "value": count,
        }

    # Column list
    if any(
        phrase in q
        for phrase in (
            "what columns",
            "which columns",
            "column names",
        )
    ):
        columns = [
            str(column)
            for column in df.columns
        ]

        return {
            "answer": (
                "The dataset contains these columns: "
                + ", ".join(columns)
                + "."
            ),
            "analysis_type": "column_list",
            "columns": columns,
        }

    # Missing values
    if any(
        phrase in q
        for phrase in (
            "missing values",
            "missing data",
            "null values",
            "nulls",
        )
    ):
        missing = (
            df.isna()
            .sum()
            .sort_values(ascending=False)
        )

        values = [
            {
                "label": str(column),
                "value": int(count),
            }
            for column, count in missing.items()
            if count > 0
        ]

        total = int(missing.sum())

        result = {
            "answer": (
                f"There are {total:,} missing "
                "values in the dataset."
            ),
            "analysis_type": "missing_values",
            "value": total,
            "values": values,
        }

        if values:
            result["chart"] = (
                missing_values_chart(values)
            )

        return result

    # Duplicate rows
    if "duplicate" in q:
        duplicates = int(
            df.duplicated().sum()
        )

        return {
            "answer": (
                f"There are {duplicates:,} "
                "duplicate rows in the dataset."
            ),
            "analysis_type": "duplicate_count",
            "value": duplicates,
        }

    # Semantic category counts
    if (
        "movie" in q
        and "type" in df.columns
    ):
        values = (
            df["type"]
            .astype(str)
            .str.strip()
            .str.lower()
        )

        count = int(
            (values == "movie").sum()
        )

        return {
            "answer": (
                f"There are {count:,} "
                "movies in the dataset."
            ),
            "analysis_type": "category_count",
            "column": "type",
            "value": "Movie",
            "count": count,
            "chart": category_count_chart(
                "type",
                "Movie",
                count,
            ),
        }

    if (
        (
            "tv show" in q
            or "tv shows" in q
        )
        and "type" in df.columns
    ):
        values = (
            df["type"]
            .astype(str)
            .str.strip()
            .str.lower()
        )

        count = int(
            (values == "tv show").sum()
        )

        return {
            "answer": (
                f"There are {count:,} "
                "TV shows in the dataset."
            ),
            "analysis_type": "category_count",
            "column": "type",
            "value": "TV Show",
            "count": count,
            "chart": category_count_chart(
                "type",
                "TV Show",
                count,
            ),
        }

    column = find_column(
        df,
        q,
    )

    # Top / most common values
    if (
        any(
            phrase in q
            for phrase in (
                "most common",
                "most frequent",
                "top ",
                "highest count",
            )
        )
        and column is not None
    ):
        limit = _extract_top_n(q)

        counts = (
            df[column]
            .dropna()
            .astype(str)
            .str.strip()
            .replace("", pd.NA)
            .dropna()
            .value_counts()
            .head(limit)
        )

        values = [
            {
                "label": str(value),
                "value": int(count),
            }
            for value, count in counts.items()
        ]

        answer_lines = [
            f'{item["label"]}: {item["value"]:,}'
            for item in values
        ]

        return {
            "answer": (
                f'The most common values in '
                f'"{column}" are: '
                + "; ".join(answer_lines)
                + "."
            ),
            "analysis_type": "value_counts",
            "column": column,
            "values": values,
            "chart": choose_value_counts_chart(
                column,
                values,
            ),
        }

    # Grouped counts
    if " by " in q:
        group_phrase = q.split(
            " by ",
            1,
        )[1].strip()

        group_column = find_column(
            df,
            group_phrase,
        )

        if group_column is not None:
            counts = (
                df[group_column]
                .dropna()
                .astype(str)
                .str.strip()
                .value_counts()
                .head(10)
            )

            values = [
                {
                    "label": str(value),
                    "value": int(count),
                }
                for value, count in counts.items()
            ]

            return {
                "answer": (
                    f'Here is the distribution '
                    f'by "{group_column}".'
                ),
                "analysis_type": "group_count",
                "group_column": group_column,
                "values": values,
                "chart": grouped_chart(
                    group_column,
                    values,
                    "Count",
                    _is_temporal(
                        df[group_column],
                        str(group_column),
                    ),
                ),
            }

    # Numeric aggregation
    operation = None

    for phrase, candidate in sorted(
        AGGREGATIONS.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        if phrase in q:
            operation = candidate
            break

    if operation and column is not None:
        try:
            value = _aggregate(
                df[column],
                operation,
            )
        except ValueError:
            value = None

        if value is not None:
            labels = {
                "mean": "average",
                "min": "minimum",
                "max": "maximum",
                "sum": "total",
                "median": "median",
            }

            return {
                "answer": (
                    f'The {labels[operation]} '
                    f'"{column}" is '
                    f"{value:,.2f}."
                ),
                "analysis_type": "aggregation",
                "operation": operation,
                "column": column,
                "value": _safe_number(value),
            }

    # Numeric distribution
    if (
        any(
            phrase in q
            for phrase in (
                "distribution of",
                "distribution for",
                "histogram of",
                "spread of",
            )
        )
        and column is not None
    ):
        numeric = pd.to_numeric(
            df[column],
            errors="coerce",
        ).dropna()

        if not numeric.empty:
            bins = min(
                10,
                max(
                    5,
                    int(math.sqrt(len(numeric))),
                ),
            )

            grouped = numeric.groupby(
                pd.cut(
                    numeric,
                    bins=bins,
                    include_lowest=True,
                    duplicates="drop",
                ),
                observed=True,
            ).size()

            values = [
                {
                    "label": str(interval),
                    "value": int(count),
                }
                for interval, count
                in grouped.items()
            ]

            return {
                "answer": (
                    f'Here is the distribution '
                    f'of "{column}".'
                ),
                "analysis_type": "distribution",
                "column": column,
                "values": values,
                "chart": histogram_chart(
                    column,
                    values,
                ),
            }

    return {
        "answer": (
            "I couldn't determine the analysis yet. "
            "Try asking about counts, top values, "
            "averages, totals, distributions, "
            "missing values, duplicates, or "
            "relationships."
        ),
        "analysis_type": "unsupported",
    }