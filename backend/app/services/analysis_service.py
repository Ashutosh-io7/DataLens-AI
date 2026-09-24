from __future__ import annotations

import math
from typing import Any
import numpy as np
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
from app.services.ml_service import train_and_explain_model 
from app.services.llm_service import generate_executive_briefing, get_llm_plan 
from app.services.code_executor import execute_pandas_query 


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
                # Sort so the "top result" actually matches what was asked:
                # op="min" means the person wants the smallest value first,
                # every other operation (max/mean/sum/median) shows the largest first.
                sort_ascending = op == "min"
                grouped = (
                    df.groupby(grp_col, observed=True)[num_col]
                    .agg(op)
                    .dropna()
                    .sort_values(ascending=sort_ascending) 
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
            non_null = df[target].dropna()
            if non_null.empty:
                return {
                    "answer": f"Column {target} has no non-empty numeric values to calculate from.",
                    "analysis_type": "aggregation_error",
                    "explanation": f"'{target}' is entirely empty after removing missing values.",
                    "suggested_follow_ups": ["Show missing values breakdown", "What columns are in this dataset?"],
                }
            val = _safe_number(getattr(non_null, op)())
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

    # 11. Machine Learning & SHAP Feature Importance
    if intent == "machine_learning":
        target = plan.get("target_column")
        try:
            ml_res = train_and_explain_model(df, target_col=target)
            task_type = ml_res["task"]
            metrics = ml_res["metrics"]
            top_feats = ml_res["top_features"]
            lead_feat = top_feats[0]["feature"] if top_feats else "N/A"

            if task_type == "classification":
                metric_str = f"accuracy: **{metrics.get('accuracy')}%**, weighted F1: **{metrics.get('f1_score')}**"
            else:
                metric_str = f"R² score: **{metrics.get('r2_score')}**, RMSE: **{metrics.get('rmse')}**"

            return {
                "answer": (
                    f"Trained an **XGBoost {task_type.capitalize()} Model** to predict `{target}` ({metric_str}).\n\n"
                    f"**SHAP Game-Theoretic Analysis** reveals that `{lead_feat}` is the single most influential driver on prediction outcomes."
                ),
                "analysis_type": "machine_learning",
                "target_column": target,
                "metrics": metrics,
                "top_features": top_feats,
                "chart": ml_res["shap_chart"],
                "explanation": (
                    f"Engineered XGBoost gradient-boosted decision trees over {len(ml_res['features_used'])} features. "
                    "Computed TreeExplainer SHAP values to calculate exact, un-biased feature importance."
                ),
                "suggested_follow_ups": [
                    f"What is the distribution of {target}?",
                    f"Correlation between {lead_feat} and other columns",
                ],
            }
        except Exception as e:
            return {
                "answer": f"Unable to train model for `{target}`: {str(e)}",
                "analysis_type": "machine_learning_error",
                "explanation": "Target column could not be encoded or insufficient features were available.",
                "suggested_follow_ups": ["How many rows in dataset?", "Show columns list"],
            }

    # 11. Dynamic Pandas Execution (Universal Data Scientist)
    if intent == "dynamic_pandas":
        code = plan.get("pandas_code")
        if code:
            try:
                res = execute_pandas_query(code, df)
                explanation = plan.get("explanation") or "Calculated directly using safe, deterministic Pandas code."
                follow_ups = plan.get("suggested_follow_ups") or [
                    "What are the top categories?",
                    "Show summary statistics",
                ]

                # Scalar result (int, float, bool)
                if isinstance(res, (int, float, np.integer, np.floating)):
                    num_val = _safe_number(res)
                    if num_val is None:
                        ans_text = "The calculation evaluated to no valid numeric value (NaN)."
                    elif isinstance(res, float) and 0.0 <= res <= 100.0 and ("percent" in question.lower() or "%" in question):
                        ans_text = f"The calculated result is **{num_val:.2f}%**."
                    else:
                        ans_text = f"The calculated result is **{num_val:,}**."

                    return {
                        "answer": ans_text,
                        "analysis_type": "dynamic_pandas",
                        "value": num_val,
                        "explanation": explanation,
                        "suggested_follow_ups": follow_ups,
                    }

                if isinstance(res, (bool, np.bool_)):
                    status_bool = "Yes (True)" if res else "No (False)"
                    return {
                        "answer": f"The query condition evaluated to **{status_bool}**.",
                        "analysis_type": "dynamic_pandas",
                        "value": bool(res),
                        "explanation": explanation,
                        "suggested_follow_ups": follow_ups,
                    }

                # Series result (breakdown / category grouping)
                if isinstance(res, pd.Series):
                    clean_s = res.dropna().head(10)
                    if clean_s.empty:
                        return {
                            "answer": "The query returned an empty result with no matching records.",
                            "analysis_type": "dynamic_pandas",
                            "explanation": explanation,
                            "suggested_follow_ups": follow_ups,
                        }

                    values = [{"label": str(k), "value": _safe_number(v)} for k, v in clean_s.items()]
                    list_items = [
                        f"- **{k}**: {v:,}" if isinstance(v, (int, float)) and v is not None else f"- **{k}**: {v}"
                        for k, v in clean_s.items()
                    ]
                    list_str = "\n".join(list_items)

                    chart = None
                    if all(isinstance(v["value"], (int, float)) for v in values if v["value"] is not None):
                        chart = grouped_chart(str(clean_s.index.name or "Category"), values, "Value")

                    return {
                        "answer": f"**Analysis Breakdown:**\n\n{list_str}",
                        "analysis_type": "dynamic_pandas",
                        "values": values,
                        "chart": chart,
                        "explanation": explanation,
                        "suggested_follow_ups": follow_ups,
                    }

                # DataFrame result (tabular / multi-column output)
                if isinstance(res, pd.DataFrame):
                    preview = res.head(10)
                    if preview.empty:
                        return {
                            "answer": "The query returned 0 rows matching your filter criteria.",
                            "analysis_type": "dynamic_pandas",
                            "explanation": explanation,
                            "suggested_follow_ups": follow_ups,
                        }

                    headers = " | ".join(str(c) for c in preview.columns)
                    divs = " | ".join("---" for _ in preview.columns)
                    rows_md = []
                    for _, row in preview.iterrows():
                        row_str = " | ".join(
                            f"{_safe_number(val):,}" if isinstance(val, (int, float)) and not pd.isna(val) else str(val)
                            for val in row
                        )
                        rows_md.append(f"| {row_str} |")

                    table_md = f"| {headers} |\n| {divs} |\n" + "\n".join(rows_md)

                    chart = None
                    if len(preview.columns) >= 2:
                        first_col, sec_col = preview.columns[0], preview.columns[1]
                        if pd.api.types.is_numeric_dtype(preview[sec_col]):
                            values = [
                                {"label": str(row[first_col]), "value": _safe_number(row[sec_col])}
                                for _, row in preview.iterrows()
                            ]
                            chart = grouped_chart(str(first_col), values, str(sec_col))

                    return {
                        "answer": f"Found **{len(res)}** matching rows. Top results:\n\n{table_md}",
                        "analysis_type": "dynamic_pandas",
                        "chart": chart,
                        "explanation": explanation,
                        "suggested_follow_ups": follow_ups,
                    }

                return {
                    "answer": f"Analysis output: **{str(res)}**",
                    "analysis_type": "dynamic_pandas",
                    "explanation": explanation,
                    "suggested_follow_ups": follow_ups,
                }
            except Exception as e:
                print(f"dynamic_pandas execution error: {e}")

    # 12. Summary Statistics
    if intent == "summary_statistics":
        num_cols = df.select_dtypes(include="number").columns.tolist()
        if not num_cols:
            return {
                "answer": "This dataset does not contain numeric columns for summary statistics.",
                "analysis_type": "summary_statistics",
                "explanation": "No numerical metrics detected in schema.",
                "suggested_follow_ups": ["Show column list", "How many rows in dataset?"],
            }

        desc = df[num_cols[:6]].describe().round(2)
        cols = desc.columns.tolist()
        headers = "Metric | " + " | ".join(cols)
        divider = "--- | " + " | ".join(["---"] * len(cols))
        rows = []
        for metric, row in desc.iterrows():
            rows.append(
                f"**{metric}** | " + " | ".join(f"{val:,}" if isinstance(val, (int, float)) else str(val) for val in row)
            )

        table = f"| {headers} |\n| {divider} |\n" + "\n".join([f"| {r} |" for r in rows])
        return {
            "answer": f"**Summary Statistics (Top Numeric Columns):**\n\n{table}",
            "analysis_type": "summary_statistics",
            "explanation": f"Computed count, mean, standard deviation, min, median, and percentiles across {len(num_cols)} numeric attributes.",
            "suggested_follow_ups": [
                f"What is the distribution of {num_cols[0]}?",
                "Show correlation between columns",
                "Are there any outliers?",
            ],
        }

    # 13. Executive Dataset Briefing
    if intent == "dataset_summary":
        briefing = generate_executive_briefing(df, question)
        return {
            "answer": briefing,
            "analysis_type": "dataset_summary",
            "explanation": "Synthesized dataset scope, key dimensions, quantitative indicators, and quality metrics.",
            "suggested_follow_ups": [
                "Show summary statistics",
                "Are there any missing values?",
                "Which features correlate with the main metrics?",
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
    plan: dict[str, Any] | None = None
    planned_by = "rule_based"

    try:
        plan = get_llm_plan(question, df)
        if plan.get("intent") and plan["intent"] != "unsupported":
            planned_by = "llm"
        else:
            plan = None  # let the rule-based planner have a try instead
    except Exception as exc:
        print(f"LLM planner unavailable, falling back to rule-based planner: {exc}")
        plan = None

    if plan is None:
        plan = plan_query(question, df, context=context)
        planned_by = "rule_based"

    result = execute_plan(plan, df, question)
    result["plan"] = plan
    result["planned_by"] = planned_by
    return result
