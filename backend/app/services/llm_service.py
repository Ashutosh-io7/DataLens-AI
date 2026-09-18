from __future__ import annotations 

from typing import Literal, Optional 
import pandas as pd 
from pydantic import BaseModel, Field 
from langchain_google_genai import ChatGoogleGenerativeAI 

from app.core.config import settings 

class QueryPlan(BaseModel) : 
    """Structured plan describing which deterministic analysis to run.
    The LLM only fills this in - it never calculates anything itself.""" 

    intent: Literal[
        "row_count",
        "column_count",
        "column_list",
        "missing_values",
        "duplicate_count",
        "correlation",
        "machine_learning",
        "value_counts",
        "grouped_aggregation",
        "aggregation",
        "distribution",
        "filter_count",
        "unsupported",
    ] = Field(description="Which analysis operation best answers the question.")
    target_column: Optional[str] = Field(default=None, description="Main column to analyze — must be an exact column name from the schema.")
    group_column: Optional[str] = Field(default=None, description="Column to group by, for grouped_aggregation.")
    columns: Optional[list[str]] = Field(default=None, description="Two or more numeric columns, for correlation.")
    operation: Optional[Literal["mean", "sum", "median", "max", "min", "std"]] = Field(default=None, description="Aggregation to apply.")
    n: Optional[int] = Field(default=10, description="How many results to return, for ranked/top-N questions.")
    ascending: Optional[bool] = Field(default=False, description="True for 'bottom/lowest' questions instead of 'top/most'.")
    filter_value: Optional[str] = Field(default=None, description="The exact category value being filtered on, for filter_count.") 


def _describe_schema(df: pd.DataFrame) -> str: 
    """Builds a plain-text description of the dataset's columns for the prompt.""" 
    lines = [] 
    for col in df.columns: 
        is_numeric = pd.api.types.is_numeric_dtype(df[col]) 
        dtype = "numeric" if is_numeric else "categorical/text" 
        sample = "" 
        if not is_numeric: 
            uniques = df[col].dropna().astype(str).unique() 
            if len(uniques) <= 15: 
                sample = f" ( example values: {', '.join(uniques[:8])})" 
        lines.append(f"- {col} ({dtype}){sample}") 
    return "\n".join(lines) 


_SYSTEM_PROMPT = """You are the query planner for a data analytics tool. \
You never calculate anything yourself — you only decide which deterministic \
analysis operation should run, and on which column(s). The exact math always \
happens afterward in tested pandas code, so accuracy depends on you picking \
the right intent and exact column names, not on you doing arithmetic.

Dataset columns:
{schema}

Rules:
- target_column, group_column, columns, and filter_value must be exact column \
names or exact values from the schema above — never invent or guess spelling.
- If the question doesn't match any listed intent, or no relevant column exists, \
use intent "unsupported".
- Use "machine_learning" only when the user is asking what drives/predicts/influences \
a column — not for simple averages or counts.
""" 

def get_llm_plan(question: str, df: pd.DataFrame) -> dict: 
    """
    Asks Gemini to turn a natural-language question into a structured plan.
    Raises an exception if the API key is missing, the call fails, or the
    response can't be produced — the caller is expected to catch this and
    fall back to the rule-based planner.
    """ 
    if not settings.google_api_key: 
        raise RuntimeError("No Gemini API key configured.") 

    llm = ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.google_api_key,
        temperature=0, 
    )

    structured_llm = llm.with_structured_output(QueryPlan) 

    system_message = _SYSTEM_PROMPT.format(schema=_describe_schema(df)) 

    result: QueryPlan = structured_llm.invoke(
        [
            ("system", system_message),
            ("human", question) 
        ]
    ) 

    plan = result.model_dump(exclude_none=True) 

    # Safety net: drop any column name the LLM picked that doesn't actually
    # exist in this dataset, in case it guessed instead of copying exactly.
    for key in ("target_column", "group_column"):
        if key in plan and plan[key] not in df.columns:
            plan.pop(key)
    if "columns" in plan:
        plan["columns"] = [c for c in plan["columns"] if c in df.columns]

    return plan