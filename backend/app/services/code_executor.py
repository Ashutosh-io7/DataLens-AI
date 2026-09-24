from __future__ import annotations

import ast
import re
from typing import Any
import numpy as np
import pandas as pd

FORBIDDEN_KEYWORDS = [
    "import", "__", "open", "eval", "exec", "compile", "globals", "locals",
    "getattr", "setattr", "delattr", "hasattr", "breakpoint", "input", "exit",
    "quit", "os", "sys", "subprocess", "socket", "requests", "shutil", "urllib",
    "pathlib", "builtin",
]


def is_safe_code(code_str: str) -> tuple[bool, str]:
    """Inspects Python code AST and tokens to guarantee safe, sandboxed execution."""
    cleaned = code_str.strip()
    
    # Check for forbidden words / double underscore dunder access
    for kw in FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{kw}\b", cleaned, re.IGNORECASE):
            return False, f"Forbidden keyword detected: {kw}"
    if "__" in cleaned:
        return False, "Accessing private/dunder attributes is not allowed."

    try:
        parsed = ast.parse(cleaned)
    except SyntaxError as e:
        return False, f"Syntax error: {e}"

    for node in ast.walk(parsed):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            return False, "Imports are not permitted."
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            return False, "Defining functions or classes is not permitted."
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in {
                "eval", "exec", "compile", "open", "input", "breakpoint", "exit", "quit"
            }:
                return False, f"Calling {node.func.id} is not permitted."

    return True, ""


def execute_pandas_query(
    code_str: str,
    df: pd.DataFrame,
) -> Any:
    """Executes validated pandas code against a copy of the dataframe in a restricted environment."""
    safe, reason = is_safe_code(code_str)
    if not safe:
        raise ValueError(f"Security validation error: {reason}")

    # Build safe execution namespace
    safe_builtins = {
        "len": len,
        "range": range,
        "int": int,
        "float": float,
        "str": str,
        "bool": bool,
        "round": round,
        "abs": abs,
        "min": min,
        "max": max,
        "sum": sum,
        "list": list,
        "dict": dict,
        "set": set,
        "tuple": tuple,
        "sorted": sorted,
        "zip": zip,
        "enumerate": enumerate,
    }

    safe_globals = {
        "__builtins__": safe_builtins,
        "pd": pd,
        "np": np,
        "df": df.copy(),
    }
    local_vars: dict[str, Any] = {}

    cleaned_code = code_str.strip()
    # If the LLM returned a single expression without "result =", wrap it automatically
    if "\n" not in cleaned_code and not cleaned_code.startswith("result"):
        cleaned_code = f"result = {cleaned_code}"

    exec(cleaned_code, safe_globals, local_vars)

    if "result" not in local_vars:
        raise ValueError("Pandas query must assign output to `result`.")

    return local_vars["result"]
