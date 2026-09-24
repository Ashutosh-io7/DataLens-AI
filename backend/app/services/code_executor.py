from __future__ import annotations

import ast
from typing import Any
import numpy as np
import pandas as pd

# ALLOWLIST, not a blocklist: only attribute/method names listed here may be
# accessed on ANY object in the sandbox (df, pd, np, or anything derived
# from them). Anything not explicitly named — including every pandas/numpy
# I/O method (to_csv, to_pickle, to_sql, read_csv, read_pickle, eval,
# query...) and everything on Python's own object model (__class__,
# __globals__, __subclasses__...) — is refused by default.
ALLOWED_ATTRS = {
    # Selection & shape
    "loc", "iloc", "at", "iat", "columns", "index", "values", "shape",
    "dtypes", "dtype", "T", "empty", "size", "ndim",
    # Filtering / cleaning
    "head", "tail", "sample", "drop", "drop_duplicates", "duplicated",
    "isna", "isnull", "notna", "notnull", "dropna", "fillna", "between",
    "isin", "where", "mask", "clip",
    # Aggregation & stats
    "mean", "sum", "median", "min", "max", "std", "var", "count", "nunique",
    "unique", "value_counts", "describe", "corr", "cov", "mode", "quantile",
    "skew", "kurt", "cumsum", "cumprod", "cummax", "cummin", "rank", "diff",
    "pct_change",
    # Grouping / reshaping / joining
    "groupby", "agg", "aggregate", "sort_values", "sort_index",
    "reset_index", "set_index", "rename", "rename_axis", "nlargest",
    "nsmallest", "merge", "join", "concat", "pivot_table", "pivot", "melt",
    # Type conversion & rounding — no file/network I/O in this list
    "astype", "round", "abs", "to_numeric", "to_datetime", "to_dict",
    "to_list", "tolist", "to_frame", "to_numpy",
    # String accessor
    "str", "contains", "lower", "upper", "strip", "split", "replace",
    "startswith", "endswith", "len",
    # Datetime accessor
    "dt", "year", "month", "day", "hour", "weekday", "dayofweek",
    # Iteration helpers
    "items", "iterrows", "keys",
}


def _check_attr(name: str) -> None:
    if name.startswith("_"):
        raise ValueError(f"Access to '{name}' is not permitted.")
    if name not in ALLOWED_ATTRS:
        raise ValueError(f"'{name}' is not on the approved method list.")


class _SafetyVisitor(ast.NodeVisitor):
    """Walks the parsed code and only allows a narrow, known-safe subset of
    Python syntax: no imports, no function/class/lambda definitions, no
    dunder or private-name access, and only attribute names on the
    approved allowlist above. Anything else is refused before it can run."""

    ALLOWED_NODE_TYPES = (
        ast.Module, ast.Expr, ast.Assign, ast.AugAssign,
        ast.Load, ast.Store,
        ast.Name, ast.Attribute, ast.Call, ast.keyword,
        ast.Constant, ast.List, ast.Tuple, ast.Dict, ast.Set,
        ast.Subscript, ast.Slice,
        ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare,
        ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod, ast.Pow,
        ast.USub, ast.UAdd, ast.Not, ast.Invert, ast.And, ast.Or,
        ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE, ast.In, ast.NotIn,
        ast.ListComp, ast.comprehension,
    )

    def generic_visit(self, node):
        if not isinstance(node, self.ALLOWED_NODE_TYPES):
            raise ValueError(f"'{type(node).__name__}' is not permitted in a query.")
        super().generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        _check_attr(node.attr)
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name):
        if node.id.startswith("_"):
            raise ValueError(f"Access to '{node.id}' is not permitted.")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Only two shapes of call are allowed: calling a method on something
        # (df.mean(), validated separately by visit_Attribute), or calling
        # one of a small set of harmless bare functions.
        if isinstance(node.func, ast.Attribute):
            pass
        elif isinstance(node.func, ast.Name):
            if node.func.id not in {"round", "len", "abs", "str", "int", "float", "min", "max", "sum", "sorted", "list", "dict"}:
                raise ValueError(f"Calling '{node.func.id}' is not permitted.")
        else:
            raise ValueError("This kind of function call is not permitted.")
        self.generic_visit(node)


def is_safe_code(code_str: str) -> tuple[bool, str]:
    """Parses the code into its real syntax tree and checks every node
    against the allowlist. Returns (True, "") if safe, or (False, reason)."""
    try:
        tree = ast.parse(code_str.strip())
    except SyntaxError as e:
        return False, f"Syntax error: {e}"

    try:
        _SafetyVisitor().visit(tree)
    except ValueError as e:
        return False, str(e)

    return True, ""


def execute_pandas_query(code_str: str, df: pd.DataFrame) -> Any:
    """Executes validated pandas code against a copy of the dataframe.
    Nothing runs until is_safe_code() has approved every single node in it —
    this is default-deny, not default-allow-minus-a-blocklist."""
    safe, reason = is_safe_code(code_str)
    if not safe:
        raise ValueError(f"Security validation error: {reason}")

    safe_builtins = {
        "len": len, "round": round, "abs": abs, "min": min, "max": max,
        "sum": sum, "sorted": sorted, "list": list, "dict": dict,
        "str": str, "int": int, "float": float, "bool": bool,
    }
    safe_globals = {"__builtins__": safe_builtins, "pd": pd, "np": np, "df": df.copy()}
    local_vars: dict[str, Any] = {}

    cleaned_code = code_str.strip()
    if "\n" not in cleaned_code and not cleaned_code.startswith("result"):
        cleaned_code = f"result = {cleaned_code}"

    exec(cleaned_code, safe_globals, local_vars)

    if "result" not in local_vars:
        raise ValueError("Pandas query must assign output to `result`.")

    return local_vars["result"]