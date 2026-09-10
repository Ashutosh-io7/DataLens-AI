import pandas as pd


def answer_question(df: pd.DataFrame, question: str) -> dict:
    question_lower = question.lower().strip()

    # Count rows
    if (
        "how many rows" in question_lower
        or "how many records" in question_lower
        or "how many entries" in question_lower
    ):
        count = len(df)

        return {
            "answer": f"There are {count:,} records in the dataset.",
            "analysis_type": "row_count",
        }

    # Count movies / TV shows by type
    if "how many movies" in question_lower:
        if "type" in df.columns:
            count = int(
                (df["type"].astype(str).str.lower() == "movie").sum()
            )

            return {
                "answer": f"There are {count:,} movies in the dataset.",
                "analysis_type": "category_count",
                "column": "type",
                "value": "Movie",
                "count": count,
            }

    if "how many tv shows" in question_lower:
        if "type" in df.columns:
            count = int(
                (df["type"].astype(str).str.lower() == "tv show").sum()
            )

            return {
                "answer": f"There are {count:,} TV shows in the dataset.",
                "analysis_type": "category_count",
                "column": "type",
                "value": "TV Show",
                "count": count,
            }

    # Missing values
    if "missing values" in question_lower:
        missing = int(df.isna().sum().sum())

        return {
            "answer": f"There are {missing:,} missing values in the dataset.",
            "analysis_type": "missing_values",
            "count": missing,
        }

    # Duplicate rows
    if "duplicate" in question_lower:
        duplicates = int(df.duplicated().sum())

        return {
            "answer": f"There are {duplicates:,} duplicate rows in the dataset.",
            "analysis_type": "duplicate_count",
            "count": duplicates,
        }

    # Column count
    if "how many columns" in question_lower:
        count = len(df.columns)

        return {
            "answer": f"The dataset has {count} columns.",
            "analysis_type": "column_count",
        }

    return {
        "answer": (
            "I understand your question, but I don't support that analysis yet. "
            "Try asking about rows, columns, movies, TV shows, missing values, "
            "or duplicate rows."
        ),
        "analysis_type": "unsupported",
    }