from __future__ import annotations

import re
from typing import Any
import pandas as pd


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(text).lower()).strip()


def match_column(question: str, df: pd.DataFrame) -> str | None:
    norm_q = f" {normalize(question)} "
    candidates = []
    
    for col in df.columns:
        norm_c = normalize(col)
        if not norm_c:
            continue
        # Exact word or phrase match within question
        if f" {norm_c} " in norm_q or norm_c in norm_q:
            candidates.append((len(norm_c), col))
            
    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]
    return None


def match_all_columns(question: str, df: pd.DataFrame) -> list[str]:
    norm_q = f" {normalize(question)} "
    matched = []
    
    for col in df.columns:
        norm_c = normalize(col)
        if not norm_c:
            continue
        if f" {norm_c} " in norm_q:
            matched.append(col)
            
    return matched


def plan_query(
    question: str,
    df: pd.DataFrame,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Produces a safe, structured analysis plan from natural language and schema.
    """
    q = question.strip().lower()
    norm_q = normalize(q)
    
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category", "string"]).columns.tolist()
    
    # 1. Row count / Dataset size
    if any(p in norm_q for p in ["how many rows", "number of rows", "total rows", "row count", "how many records", "how big is"]):
        return {"intent": "row_count", "operation": "count"}

    # 2. Column count / list
    if any(p in norm_q for p in ["how many columns", "number of columns", "column count"]):
        return {"intent": "column_count", "operation": "count"}
        
    if any(p in norm_q for p in ["what columns", "list columns", "show columns", "column names"]):
        return {"intent": "column_list", "operation": "list"}

    # 3. Missing values analysis
    if any(p in norm_q for p in ["missing value", "missing data", "null value", "nulls", "empty cells"]):
        target_col = match_column(question, df)
        return {"intent": "missing_values", "target_column": target_col}

    # 4. Duplicate rows
    if "duplicate" in norm_q:
        return {"intent": "duplicate_count"}

    # 5. Correlation analysis
    if any(p in norm_q for p in ["correlation", "correlate", "relationship between"]):
        cols = match_all_columns(question, df)
        num_matched = [c for c in cols if c in numeric_cols]
        return {
            "intent": "correlation",
            "columns": num_matched if len(num_matched) >= 2 else numeric_cols[:5],
        }

    # 6. Extract top / bottom N limit
    n = 10
    top_match = re.search(r"\btop\s+(\d+)\b", norm_q)
    bottom_match = re.search(r"\b(bottom|lowest)\s+(\d+)\b", norm_q)
    is_bottom = bool(bottom_match)
    if top_match:
        n = min(max(int(top_match.group(1)), 1), 50)
    elif bottom_match:
        n = min(max(int(bottom_match.group(2)), 1), 50)

    # 7. Check for group by ("by <column>" or "per <column>")
    group_col = None
    by_match = re.search(r"\b(by|per|across|for each)\s+([a-zA-Z0-9_\s]+)", q)
    if by_match:
        potential_phrase = by_match.group(2).strip()
        group_col = match_column(potential_phrase, df)

    # 8. Check for aggregation terms
    agg_op = None
    agg_map = {
        "mean": "mean",
        "average": "mean",
        "avg": "mean",
        "sum": "sum",
        "total": "sum",
        "median": "median",
        "maximum": "max",
        "max": "max",
        "highest": "max",
        "minimum": "min",
        "min": "min",
        "lowest": "min",
        "standard deviation": "std",
        "std": "std",
    }
    for phrase, op in agg_map.items():
        if f" {phrase} " in f" {norm_q} ":
            agg_op = op
            break

    target_col = match_column(question, df)
    
    # If target column is the same as group_col, look for another column
    if target_col and group_col and target_col == group_col:
        for col in df.columns:
            if col != group_col and normalize(col) in norm_q:
                target_col = col
                break

    # 9. Context inheritance for follow-up questions
    if context:
        if not target_col and context.get("target_column") in df.columns:
            target_col = context["target_column"]
        if not group_col and context.get("group_column") in df.columns:
            group_col = context["group_column"]

    # 10. Check if this is a value count / frequency query
    if any(p in norm_q for p in ["most common", "most frequent", "top", "distribution", "breakdown", "frequency", "count of"]):
        if target_col or group_col:
            active_col = group_col or target_col
            return {
                "intent": "value_counts",
                "target_column": active_col,
                "n": n,
                "ascending": is_bottom,
            }

    # 11. Grouped aggregation (e.g., "average salary by department")
    if group_col and (target_col or agg_op):
        num_target = target_col if (target_col in numeric_cols) else (numeric_cols[0] if numeric_cols else None)
        return {
            "intent": "grouped_aggregation",
            "group_column": group_col,
            "target_column": num_target,
            "operation": agg_op or "mean",
            "n": n,
        }

    # 12. Single metric aggregation (e.g., "what is the average revenue?")
    if agg_op and target_col and target_col in numeric_cols:
        return {
            "intent": "aggregation",
            "target_column": target_col,
            "operation": agg_op,
        }

    # 13. Numeric distribution / histogram
    if any(p in norm_q for p in ["histogram", "spread", "distribution of"]):
        active_col = target_col if (target_col in numeric_cols) else (numeric_cols[0] if numeric_cols else None)
        if active_col:
            return {
                "intent": "distribution",
                "target_column": active_col,
            }

    # 14. Filter search (e.g., "how many <category> are there?")
    # Check if a categorical value was mentioned
    for cat_col in categorical_cols:
        top_sample = df[cat_col].dropna().astype(str).str.strip().unique()[:30]
        for val in top_sample:
            norm_val = normalize(val)
            if len(norm_val) > 2 and f" {norm_val} " in f" {norm_q} ":
                return {
                    "intent": "filter_count",
                    "target_column": cat_col,
                    "filter_value": val,
                }

    # 15. Fallback ranking / general column check
    if target_col:
        if target_col in categorical_cols:
            return {
                "intent": "value_counts",
                "target_column": target_col,
                "n": n,
                "ascending": is_bottom,
            }
        elif target_col in numeric_cols:
            return {
                "intent": "aggregation",
                "target_column": target_col,
                "operation": agg_op or "mean",
            }

    # Default fallback
    return {
        "intent": "unsupported",
        "question": question,
    }
