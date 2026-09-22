from __future__ import annotations 

from typing import Literal, Optional 
import pandas as pd 
from pydantic import BaseModel, Field 
from langchain_google_genai import ChatGoogleGenerativeAI 
import concurrent.futures 

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
    group_column: Optional[str] = Field(default=None, description=(
        "Column to group by. REQUIRED whenever the question is really asking "
        "'which <category> has the most/least/highest/lowest <metric>', or asks "
        "for a breakdown 'by/per <category>' — even if the word used in the "
        "question (e.g. 'car', 'product', 'city') isn't an exact column name. "
        "Pick whichever categorical column in the schema represents that entity."
    ))
    columns: Optional[list[str]] = Field(default=None, description="Two or more numeric columns, for correlation.") 
    operation: Optional[Literal["mean", "sum", "median", "max", "min", "std"]] = Field(default=None, description=(
        "Aggregation to apply. Use 'max' for 'most/highest/top/best'. Use 'min' "
        "for 'least/lowest/bottom/worst'. Use 'mean' for 'average'. Use 'sum' for 'total'."
    ))
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

Choosing between "aggregation" and "grouped_aggregation" (the most common mistake — read carefully):
- Use "aggregation" ONLY for a single summary number across the WHOLE column, \
with no category involved. Example: "What is the average selling price?" -> \
intent=aggregation, target_column=Selling_Price, operation=mean.
- Use "grouped_aggregation" whenever the answer needs to name a specific row \
or category — including "which <thing> has the most/least/highest <metric>", \
"top N <category> by <metric>", or "<metric> by <category>". target_column is \
the numeric metric, group_column is the categorical column identifying <thing> \
(infer it from the schema even if the question's wording doesn't match the \
column name exactly), and operation is max/min/mean based on the wording.
  Example: "Which car makes the most selling price?" -> intent=grouped_aggregation, \
group_column=Car_Name, target_column=Selling_Price, operation=max.
  Example: "average revenue by region" -> intent=grouped_aggregation, \
group_column=Region, target_column=Revenue, operation=mean.
""" 

_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def _call_llm(question: str, df: pd.DataFrame) -> dict:
    """Does the actual Gemini call. Runs inside a worker thread so it can be
    forcibly timed out by get_llm_plan() below, no matter what the SDK is
    doing internally (retries, multi-step tool calling, etc.)."""
    llm = ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.google_api_key,
        timeout=15,
        max_retries=0,  # the hard deadline below is the real safety net
    )
    structured_llm = llm.with_structured_output(QueryPlan)

    system_message = _SYSTEM_PROMPT.format(schema=_describe_schema(df))

    result: QueryPlan = structured_llm.invoke(
        [
            ("system", system_message),
            ("human", question),
        ]
    )

    plan = result.model_dump(exclude_none=True)

    for key in ("target_column", "group_column"):
        if key in plan and plan[key] not in df.columns:
            plan.pop(key)
    if "columns" in plan:
        plan["columns"] = [c for c in plan["columns"] if c in df.columns]

    return plan


def get_llm_plan(question: str, df: pd.DataFrame) -> dict:
    """
    Asks Gemini to turn a natural-language question into a structured plan.
    Enforces a hard 20-second deadline no matter what the Gemini SDK does
    internally — if it's not done by then, this raises TimeoutError.
    The caller is expected to catch any exception here and fall back to
    the rule-based planner.
    """
    if not settings.google_api_key:
        raise RuntimeError("No Gemini API key configured.")

    future = _executor.submit(_call_llm, question, df)
    try:
        return future.result(timeout=20)
    except concurrent.futures.TimeoutError:
        raise TimeoutError("Gemini did not respond within 20 seconds.")