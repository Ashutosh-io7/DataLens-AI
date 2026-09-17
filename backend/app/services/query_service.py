from __future__ import annotations

from typing import Any
import pandas as pd

from app.services.analysis_service import analyze_question


def answer_question(
    df: pd.DataFrame,
    question: str,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return analyze_question(
        df,
        question,
        context=context,
    )
