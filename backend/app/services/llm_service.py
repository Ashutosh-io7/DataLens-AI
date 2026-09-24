from __future__ import annotations

import concurrent.futures
from typing import Literal, Optional
import pandas as pd
from pydantic import BaseModel, Field

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    _HAS_GENAI = True
except ImportError:
    ChatGoogleGenerativeAI = None
    _HAS_GENAI = False

from app.core.config import settings


class QueryPlan(BaseModel):
    """Structured plan describing which deterministic analysis or dynamic query to run.
    The LLM never fabricates numbers — math is always executed on the actual dataframe."""

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
        "summary_statistics",
        "dataset_summary",
        "dynamic_pandas",
        "unsupported",
    ] = Field(description="Which analysis operation best answers the question.")
    target_column: Optional[str] = Field(default=None, description="Main column to analyze — must be an exact column name from the schema.")
    group_column: Optional[str] = Field(default=None, description="Column to group by.")
    columns: Optional[list[str]] = Field(default=None, description="Two or more numeric columns, for correlation.")
    operation: Optional[Literal["mean", "sum", "median", "max", "min", "std"]] = Field(default=None, description="Aggregation to apply.")
    n: Optional[int] = Field(default=10, description="How many results to return, for ranked/top-N questions.")
    ascending: Optional[bool] = Field(default=False, description="True for 'bottom/lowest' questions instead of 'top/most'.")
    filter_value: Optional[str] = Field(default=None, description="The exact category value being filtered on, for filter_count.")
    pandas_code: Optional[str] = Field(
        default=None,
        description=(
            "Executable Python snippet for 'dynamic_pandas'. Must assign result to variable `result`. "
            "Use only `df`, `pd`, and `np`. Never use imports, open(), or network. "
            "Example: result = df[df['Fuel_Type'] == 'Diesel']['Selling_Price'].mean()"
        ),
    )
    explanation: Optional[str] = Field(
        default=None,
        description="Clear 1-2 sentence analytical explanation of the calculation and business insight.",
    )
    chart_type: Optional[Literal["bar", "horizontal_bar", "line", "pie", "none"]] = Field(
        default="none",
        description="Suggested visualization type if the result is tabular or categorical.",
    )
    suggested_follow_ups: Optional[list[str]] = Field(
        default_factory=list,
        description="2-3 relevant follow-up questions the user might want to explore next.",
    )


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
                sample = f" (example values: {', '.join(uniques[:8])})"
        else:
            non_null = df[col].dropna()
            if not non_null.empty:
                sample = f" (min: {round(float(non_null.min()), 1)}, max: {round(float(non_null.max()), 1)})"
        lines.append(f"- {col} ({dtype}){sample}")
    return "\n".join(lines)


_SYSTEM_PROMPT = """You are the lead AI Data Scientist and Query Planner for DataLens AI.
Your goal is to answer ANY analytical question about the user's dataset with 100% numerical accuracy.
You NEVER fabricate numbers. Instead, you map the user's intent into either a standard analysis or a safe, clean Pandas snippet that will be executed deterministically on the dataset.

Dataset columns & types:
{schema}

Available Intents & Rules:

1. Standard Direct Intents (Use when simple and exact):
   - "row_count": How many rows / total records?
   - "column_count" / "column_list": How many columns / what are the columns?
   - "missing_values": How many missing / null values?
   - "duplicate_count": Are there duplicate rows?
   - "correlation": Relationship / correlation between 2+ numeric columns.
   - "machine_learning": When asked to PREDICT, FORECAST, or find what DRIVES/INFLUENCES a column.
   - "value_counts": Frequency distribution of a single categorical column.
   - "aggregation": Single summary number over entire column (e.g. "average price", "total revenue").
   - "grouped_aggregation": Ranking or breakdown by a category across all records (e.g. "average revenue by region", "which car has the highest selling price").
   - "distribution": Histogram / distribution of a single numeric column.
   - "summary_statistics": When asked for "summary statistics", "describe", "statistical overview of all columns".
   - "dataset_summary": When asked "what is this dataset about?", "summarize this data", "executive summary", "key takeaways", "insights".

2. "dynamic_pandas" Intent (UNIVERSAL DATA SCIENTIST ENGINE):
   Use "dynamic_pandas" for ANY question that requires:
   - Filtering before aggregating (e.g. "average price of petrol cars", "customers in North region with churn=yes")
   - Multi-column comparison (e.g. "compare average price of petrol vs diesel cars", "is automatic more expensive than manual?")
   - Calculating ratios or percentages (e.g. "what percentage of cars are Automatic?", "share of revenue from West region")
   - Multi-condition queries (e.g. "cars made after 2015 with price under 5 lakhs")
   - Complex sorting (e.g. "top 3 models by sales in 2018")
   - Any question that does NOT cleanly fit single-column standard intents.

   When choosing "dynamic_pandas":
   - Write clean, safe Pandas code in `pandas_code`.
   - The snippet MUST assign its final output to variable `result`.
   - Examples of `pandas_code`:
     * Filter & Mean: result = round(float(df[df['Fuel_Type'] == 'Petrol']['Selling_Price'].mean()), 2)
     * Comparison Series: result = df.groupby('Fuel_Type')['Selling_Price'].mean().round(2)
     * Percentage: result = round(float((df['Transmission'] == 'Automatic').mean() * 100), 2)
     * Filtered Top N: result = df[df['Year'] >= 2015].nlargest(5, 'Selling_Price')[['Car_Name', 'Selling_Price', 'Year']]
   - Provide a clear 1-sentence analytical `explanation`.
   - If output is grouped or tabular, set `chart_type` to 'bar', 'horizontal_bar', or 'line'.
   - Provide 2-3 relevant `suggested_follow_ups`.

3. "unsupported" Intent:
   Use ONLY if the user's question is completely unrelated to data analysis or asks about entities not present in the dataset schema.
"""

_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def _call_llm(question: str, df: pd.DataFrame) -> dict:
    """Does the actual Gemini call with structured output."""
    llm = ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.google_api_key,
        timeout=18,
        max_retries=1,
        thinking_budget=2048,
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

    # Sanitize column references for direct intents
    for key in ("target_column", "group_column"):
        if key in plan and plan[key] not in df.columns:
            plan.pop(key)
    if "columns" in plan:
        plan["columns"] = [c for c in plan["columns"] if c in df.columns]

    return plan


def get_llm_plan(question: str, df: pd.DataFrame) -> dict:
    """
    Asks Gemini to turn any natural-language question into an executable analysis plan.
    Enforces a hard 20-second deadline.
    """
    if not _HAS_GENAI:
        raise RuntimeError("langchain-google-genai is not installed.")
    if not settings.google_api_key:
        raise RuntimeError("No Gemini API key configured.")

    future = _executor.submit(_call_llm, question, df)
    try:
        return future.result(timeout=20)
    except concurrent.futures.TimeoutError:
        raise TimeoutError("Gemini did not respond within 20 seconds.")


def generate_executive_briefing(df: pd.DataFrame, question: str) -> str:
    """Generates a grounded, high-level executive briefing when asked for overall dataset summaries."""
    if not _HAS_GENAI or not settings.google_api_key:
        return f"This dataset contains {len(df):,} records and {len(df.columns)} columns."

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    stats_summary = {}
    for col in numeric_cols[:4]:
        series = df[col].dropna()
        if not series.empty:
            stats_summary[col] = {
                "mean": round(float(series.mean()), 2),
                "min": round(float(series.min()), 2),
                "max": round(float(series.max()), 2),
            }

    cat_summary = {}
    for col in categorical_cols[:4]:
        cat_summary[col] = df[col].dropna().value_counts().head(3).to_dict()

    prompt = (
        f"You are the executive data science analyst for DataLens AI. "
        f"Provide a crisp, professional, bulleted executive briefing for this dataset.\n\n"
        f"Dataset Overview:\n"
        f"- Rows: {len(df):,}\n"
        f"- Columns: {len(df.columns)} ({', '.join(df.columns[:10])})\n"
        f"- Numeric Column Samples: {stats_summary}\n"
        f"- Categorical Top Values: {cat_summary}\n\n"
        f"User query: '{question}'\n\n"
        f"Format your answer with:\n"
        f"1. **Core Domain & Purpose** (1-2 sentences on what this data represents)\n"
        f"2. **Key Quantitative Highlights** (2-3 bullets with real numbers from above)\n"
        f"3. **Data Quality Note** (completeness)\n"
        f"Keep the tone polished, objective, and executive-ready."
    )

    try:
        llm = ChatGoogleGenerativeAI(
            model=settings.llm_model,
            google_api_key=settings.google_api_key,
            timeout=15,
            max_retries=0,
        )
        res = llm.invoke(prompt)
        return res.content.strip()
    except Exception as exc:
        return (
            f"The dataset contains **{len(df):,}** records across **{len(df.columns)}** attributes. "
            f"Key numeric indicators include {', '.join(numeric_cols[:3]) if numeric_cols else 'no numerical columns'}."
        )