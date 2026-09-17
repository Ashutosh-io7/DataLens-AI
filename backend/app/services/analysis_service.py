from __future__ import annotations

import math
from typing import Any
import pandas as pd

from app.services.visualization_service import (
    category_count_chart,
    choose_value_counts_chart,
    correlation_chart,
    grouped_chart,
    histogram_chart,
    missing_values_chart,
    scatter_chart,
    value_counts_chart,
)
from app.services.query_planner import plan_query


def _safe_number(value: Any) -> int | float | None:
    if pd.isna(value):
        return None
    try:
        numeric = float(value)
        if not math.isfinite(numeric):
            return None
        if numeric.is_integer():
            return int(numeric)
        return round(numeric, 2)
    except (ValueError, TypeError):
        return None


def _is_temporal_col(series: pd.Series, name: str) -> bool:
    norm = name.lower()
    return (
        "year" in norm
        or "date" in norm
        or "time" in norm
        or "month" in norm
        or "day" in norm
        or pd.api.types.is_datetime64_any_dtype(series)
    )


def execute_plan(plan: dict[str, Any], df: pd.DataFrame, question: str) -> dict[str, Any]:
    """
    Executes a structured query plan deterministically over the pandas DataFrame.
    """
    intent = plan.get("intent")

    # 1. Row count
    if intent == "row_count":
        cnt = len(df)
        return {
            "answer": f"The dataset contains **{cnt:,}** rows (records).",
            "analysis_type": "row_count",
            "value": cnt,
            "explanation": f"Calculated the exact record count across all {len(df.columns)} columns in the loaded dataset.",
            "suggested_follow_ups": [
                "What columns are in this dataset?",
                "Are there any duplicate rows?",
                "Show missing values breakdown",
            ],
        }

    # 2. Column count / list
    if intent == "column_count":
        cnt = len(df.columns)
        return {
            "answer": f"The dataset has **{cnt}** columns.",
            "analysis_type": "column_count",
            "value": cnt,
            "explanation": f"Schema analysis identified {cnt} unique attributes.",
            "suggested_follow_ups": ["What columns are in this dataset?", "Check missing values"],
        }

    if intent == "column_list":
        cols = df.columns.tolist()
        formatted = ", ".join([f"{c}" for c in cols])
        return {
            "answer": f"The dataset contains these columns: {formatted}.",
            "analysis_type": "column_list",
            "columns": cols,
            "explanation": f"Total {len(cols)} columns available for analysis.",
            "suggested_follow_ups": [f"Distribution of {cols[0]}", "Show summary statistics"],
        }

    # 3. Missing values
    if intent == "missing_values":
        target = plan.get("target_column")
        if target and target in df.columns:
            missing_cnt = int(df[target].isna().sum())
            pct = round((missing_cnt / max(len(df), 1)) * 100, 2)
            return {
                "answer": f"Column {target} has **{missing_cnt:,}** missing values ({pct}% of the dataset).",
                "analysis_type": "missing_values",
                "value": missing_cnt,
                "explanation": f"Evaluated null cells for attribute '{target}'.",
                "suggested_follow_ups": ["Check duplicates", "Show dataset quality score"],
            }

        missing_series = df.isna().sum().sort_values(ascending=False)
        missing_list = [
            {"label": str(col), "value": int(cnt)}
            for col, cnt in missing_series.items()
            if cnt > 0
        ]
        total_missing = int(missing_series.sum())

        result: dict[str, Any] = {
            "answer": (
                f"There are **{total_missing:,}** total missing values across the dataset."
                if total_missing > 0
                else "No missing values found! Every column has 100% complete data."
            ),
            "analysis_type": "missing_values",
            "value": total_missing,
            "values": missing_list,
            "explanation": "Calculated non-null completeness for all attributes.",
            "suggested_follow_ups": ["Are there any duplicate rows?", "Show summary statistics"],
        }
        if missing_list:
            result["chart"] = missing_values_chart(missing_list[:12])
        return result

    # 4. Duplicate count
    if intent == "duplicate_count":
        dups = int(df.duplicated().sum())
        pct = round((dups / max(len(df), 1)) * 100, 2)
        return {
            "answer": f"Found **{dups:,}** duplicate rows ({pct}% of total records).",
            "analysis_type": "duplicate_count",
            "value": dups,
            "explanation": "Checked row-wise exact equality across all columns.",
            "suggested_follow_ups": ["Show missing values", "How many rows in dataset?"],
        }

    # 5. Filter count (e.g., 'how many Movie are there')
    if intent == "filter_count":
        col = plan.get("target_column")
        val = plan.get("filter_value")
        if col in df.columns:
            cleaned_series = df[col].dropna().astype(str).str.strip().str.lower()
            match_count = int((cleaned_series == str(val).lower()).sum())
            total = len(df)
            pct = round((match_count / max(total, 1)) * 100, 1)
            return {
                "answer": f"There are **{match_count:,}** records where {col} is '{val}' ({pct}% of the dataset).",
                "analysis_type": "category_count",
                "column": col,
                "value": val,
                "count": match_count,
                "chart": category_count_chart(col, str(val), match_count),
                "explanation": f"Exact subset count for '{val}' in column '{col}'.",
                "suggested_follow_ups": [f"What are the other values in {col}?", "Breakdown by year"],
            }

    # 6. Value counts / Frequencies
    if intent == "value_counts":
        target = plan.get("target_column")
        if target and target in df.columns:
            n = plan.get("n", 10)
            ascending = plan.get("ascending", False)
            counts = (
                df[target]
                .dropna()
                .astype(str)
                .str.strip()
                .replace("", pd.NA)
                .dropna()
                .value_counts(ascending=ascending)
                .head(n)
            )

            values = [{"label": str(k), "value": int(v)} for k, v in counts.items()]
            top_label = values[0]["label"] if values else "N/A"
            top_val = values[0]["value"] if values else 0

            return {
                "answer": (
                    f"The most common value in {target} is **{top_label}** with **{top_val:,}** occurrences. "
                    f"Showing top {len(values)} categories."
                ),
                "analysis_type": "value_counts",
                "column": target,
                "values": values,
                "chart": choose_value_counts_chart(target, values),
                "explanation": f"Categorical frequency ranking on column '{target}'.",
                "suggested_follow_ups": [
                    f"Distribution of another column",
                    f"What is the missing percentage for {target}?",
                ],
            }

    # 7. Grouped aggregation (e.g., 'sales by region')
    if intent == "grouped_aggregation":
        grp_col = plan.get("group_column")
        num_col = plan.get("target_column")
        op = plan.get("operation", "mean")
        n = plan.get("n", 10)

        if grp_col in df.columns:
            if num_col and num_col in df.columns and pd.api.types.is_numeric_dtype(df[num_col]):
                # Grouped numeric calculation
                grouped = (
                    df.groupby(grp_col, observed=True)[num_col]
                    .agg(op)
                    .dropna()
                    .sort_values(ascending=False)
                    .head(n)
                )
                values = [{"label": str(k), "value": _safe_number(v)} for k, v in grouped.items()]
                is_temporal = _is_temporal_col(df[grp_col], grp_col)

                op_names = {"mean": "Average", "sum": "Total", "median": "Median", "max": "Max", "min": "Min"}
                op_title = op_names.get(op, op.capitalize())

                return {
                    "answer": f"Calculated **{op_title} of {num_col} by {grp_col}**. Top result is **{values[0]['label']}** ({values[0]['value']:,}).",
                    "analysis_type": "grouped_aggregation",
                    "group_column": grp_col,
                    "target_column": num_col,
                    "values": values,
                    "chart": grouped_chart(grp_col, values, f"{op_title} {num_col}", temporal=is_temporal),
                    "explanation": f"Grouped {len(df)} records by '{grp_col}' and aggregated '{num_col}' using {op}.",
                    "suggested_follow_ups": [
                        f"What is the overall average {num_col}?",
                        f"Show distribution of {num_col}",
                    ],
                }
            else:
                # Grouped record counts
                counts = df[grp_col].dropna().value_counts().head(n)
                values = [{"label": str(k), "value": int(v)} for k, v in counts.items()]
                is_temporal = _is_temporal_col(df[grp_col], grp_col)
                return {
                    "answer": f"Distribution by {grp_col}. Highest count is **{values[0]['label']}** with **{values[0]['value']:,}** records.",
                    "analysis_type": "group_count",
                    "group_column": grp_col,
                    "values": values,
                    "chart": grouped_chart(grp_col, values, "Count", temporal=is_temporal),
                    "explanation": f"Aggregated occurrences across categories of '{grp_col}'.",
                    "suggested_follow_ups": [f"Show top categories in {grp_col}", "Check missing values"],
                }

    # 8. Single numeric aggregation
    if intent == "aggregation":
        target = plan.get("target_column")
        op = plan.get("operation", "mean")
        if target in df.columns and pd.api.types.is_numeric_dtype(df[target]):
            val = _safe_number(getattr(df[target].dropna(), op)())
            labels = {
                "mean": "average",
                "sum": "sum (total)",
                "median": "median",
                "max": "maximum",
                "min": "minimum",
                "std": "standard deviation",
            }
            label = labels.get(op, op)
            return {
                "answer": f"The **{label}** of {target} is **{val:,}**.",
                "analysis_type": "aggregation",
                "column": target,
                "operation": op,
                "value": val,
                "explanation": f"Deterministic calculation computed on all valid numeric rows of '{target}'.",
                "suggested_follow_ups": [
                    f"What is the minimum and maximum of {target}?",
                    f"Show histogram of {target}",
                ],
            }

    # 9. Distribution / Histogram
    if intent == "distribution":
        target = plan.get("target_column")
        if target in df.columns and pd.api.types.is_numeric_dtype(df[target]):
            numeric = df[target].dropna()
            if not numeric.empty:
                bins = min(10, max(5, int(math.sqrt(len(numeric)))))
                cuts = pd.cut(numeric, bins=bins, include_lowest=True, duplicates="drop")
                grouped = numeric.groupby(cuts, observed=True).size()
                values = [{"label": f"{int(i.left)}-{int(i.right)}" if i.left.is_integer() else f"{i.left:.1f} to {i.right:.1f}", "value": int(cnt)} for i, cnt in grouped.items()]

                return {
                    "answer": f"Visualizing the distribution of {target} across {bins} equal-width intervals. Median: **{numeric.median():,.2f}**, Mean: **{numeric.mean():,.2f}**.",
                    "analysis_type": "distribution",
                    "column": target,
                    "values": values,
                    "chart": histogram_chart(target, values),
                    "explanation": f"Binned {len(numeric)} data points into {bins} segments.",
                    "suggested_follow_ups": [
                        f"What is the standard deviation of {target}?",
                        "Are there any outliers?",
                    ],
                }

    # 10. Pearson correlation
    if intent == "correlation":
        num_cols = plan.get("columns", [])
        if len(num_cols) >= 2:
            sub = df[num_cols].dropna()
            if len(sub) > 2:
                corr_matrix = sub.corr(method="pearson").round(3)
                primary = num_cols[0]
                secondary = num_cols[1]
                corr_val = corr_matrix.loc[primary, secondary]

                # Points for scatter chart
                sample_pts = sub.head(100)
                points = [{"x": _safe_number(r[secondary]), "y": _safe_number(r[primary])} for _, r in sample_pts.iterrows()]

                strength = "strong" if abs(corr_val) >= 0.7 else "moderate" if abs(corr_val) >= 0.4 else "weak"
                direction = "positive" if corr_val > 0 else "negative"

                return {
                    "answer": f"Pearson correlation between {primary} and {secondary} is **{corr_val:+.3f}** ({strength} {direction} correlation).",
                    "analysis_type": "correlation",
                    "correlation": corr_val,
                    "chart": scatter_chart(secondary, primary, points),
                    "explanation": f"Computed linear relationship score across {len(sub)} complete rows.",
                    "suggested_follow_ups": [
                        f"Distribution of {primary}",
                        f"Distribution of {secondary}",
                    ],
                }

    # Fallback when intent is unclear or required columns are missing
    return {
        "answer": (
            "I couldn't identify a clear analytical operation or matching columns for that query. "
            "Try asking about totals, averages, top categories, distributions, correlations, or missing values."
        ),
        "analysis_type": "unsupported",
        "explanation": "No matching columns or aggregation directives could be extracted from your question.",
        "suggested_follow_ups": [
            "How many rows are in the dataset?",
            "Show column names",
            "What are the top categories?",
        ],
    }


def analyze_question(
    df: pd.DataFrame,
    question: str,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    plan = plan_query(question, df, context=context)
    result = execute_plan(plan, df, question)
    result["plan"] = plan
    return result
