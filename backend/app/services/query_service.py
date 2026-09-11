import re

import pandas as pd


def _find_column(
    df: pd.DataFrame,
    question: str,
) -> str | None:
    question_lower = question.lower()

    # Exact column-name match first
    for column in df.columns:
        column_lower = str(column).lower()

        if column_lower in question_lower:
            return column

    # Match normalized column names
    for column in df.columns:
        normalized = re.sub(
            r"[^a-z0-9]+",
            " ",
            str(column).lower(),
        ).strip()

        if normalized and normalized in question_lower:
            return column

    return None


def _count_category(
    df: pd.DataFrame,
    column: str,
    value: str,
) -> dict:
    values = df[column].astype(str).str.strip().str.lower()

    count = int((values == value.lower()).sum())

    return {
        "answer": (
            f'There are {count:,} rows where '
            f'"{column}" is "{value}".'
        ),
        "analysis_type": "category_count",
        "column": column,
        "value": value,
        "count": count,
    }


def answer_question(
    df: pd.DataFrame,
    question: str,
) -> dict:
    question_lower = question.lower().strip()

    if not question_lower:
        return {
            "answer": "Please enter a question about your dataset.",
            "analysis_type": "invalid",
        }

    # ---------------------------------------------------------
    # Dataset-level questions
    # ---------------------------------------------------------

    if any(
        phrase in question_lower
        for phrase in [
            "how many rows",
            "how many records",
            "how many entries",
            "number of rows",
            "number of records",
        ]
    ):
        count = len(df)

        return {
            "answer": f"There are {count:,} records in the dataset.",
            "analysis_type": "row_count",
            "value": count,
        }

    if any(
        phrase in question_lower
        for phrase in [
            "how many columns",
            "number of columns",
        ]
    ):
        count = len(df.columns)

        return {
            "answer": f"The dataset has {count} columns.",
            "analysis_type": "column_count",
            "value": count,
        }

    if (
        "what columns" in question_lower
        or "which columns" in question_lower
        or "column names" in question_lower
    ):
        columns = df.columns.tolist()

        return {
            "answer": (
                "The dataset contains these columns: "
                + ", ".join(map(str, columns))
                + "."
            ),
            "analysis_type": "column_list",
            "columns": columns,
        }

    # ---------------------------------------------------------
    # Data quality
    # ---------------------------------------------------------

    if (
        "missing values" in question_lower
        or "missing data" in question_lower
        or "null values" in question_lower
    ):
        missing = int(df.isna().sum().sum())

        return {
            "answer": (
                f"There are {missing:,} missing values "
                "in the dataset."
            ),
            "analysis_type": "missing_values",
            "value": missing,
        }

    if (
        "duplicate" in question_lower
        or "duplicates" in question_lower
    ):
        duplicates = int(df.duplicated().sum())

        return {
            "answer": (
                f"There are {duplicates:,} duplicate rows "
                "in the dataset."
            ),
            "analysis_type": "duplicate_count",
            "value": duplicates,
        }

    # ---------------------------------------------------------
    # Generic category count
    # ---------------------------------------------------------

    column = _find_column(df, question_lower)

    # Netflix-specific semantic aliases
    if "movie" in question_lower and "type" in df.columns:
        return _count_category(df, "type", "Movie")

    if (
        ("tv show" in question_lower or "tv shows" in question_lower)
        and "type" in df.columns
    ):
        return _count_category(df, "type", "TV Show")

    # ---------------------------------------------------------
    # Numeric analysis
    # ---------------------------------------------------------

    if column is not None:
        numeric = pd.to_numeric(
            df[column],
            errors="coerce",
        ).dropna()

        if len(numeric) > 0:

            if "average" in question_lower or "mean" in question_lower:
                value = float(numeric.mean())

                return {
                    "answer": (
                        f'The average "{column}" is '
                        f"{value:,.2f}."
                    ),
                    "analysis_type": "average",
                    "column": column,
                    "value": value,
                }

            if (
                "minimum" in question_lower
                or "min" in question_lower
                or "lowest" in question_lower
            ):
                value = float(numeric.min())

                return {
                    "answer": (
                        f'The minimum "{column}" is '
                        f"{value:,.2f}."
                    ),
                    "analysis_type": "minimum",
                    "column": column,
                    "value": value,
                }

            if (
                "maximum" in question_lower
                or "max" in question_lower
                or "highest" in question_lower
            ):
                value = float(numeric.max())

                return {
                    "answer": (
                        f'The maximum "{column}" is '
                        f"{value:,.2f}."
                    ),
                    "analysis_type": "maximum",
                    "column": column,
                    "value": value,
                }

    # ---------------------------------------------------------
    # Value frequencies
    # ---------------------------------------------------------

    if (
        "most common" in question_lower
        or "most frequent" in question_lower
        or "top" in question_lower
    ):
        if column is not None:
            counts = (
                df[column]
                .dropna()
                .astype(str)
                .value_counts()
                .head(5)
            )

            if len(counts) > 0:
                values = [
                    {
                        "value": str(value),
                        "count": int(count),
                    }
                    for value, count in counts.items()
                ]

                answer_lines = [
                    f"{item['value']}: {item['count']:,}"
                    for item in values
                ]

                return {
                    "answer": (
                        f'The most common values in "{column}" are: '
                        + "; ".join(answer_lines)
                        + "."
                    ),
                    "analysis_type": "value_counts",
                    "column": column,
                    "values": values,
                }

    # ---------------------------------------------------------
    # Fallback
    # ---------------------------------------------------------

    return {
        "answer": (
            "I couldn't determine the analysis yet. "
            "Try asking about rows, columns, missing values, "
            "duplicates, averages, minimums, maximums, or "
            "the most common values in a column."
        ),
        "analysis_type": "unsupported",
    }