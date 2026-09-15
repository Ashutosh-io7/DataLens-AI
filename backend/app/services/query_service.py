from __future__ import annotations

import pandas as pd

from app.services.analysis_service import analyze_question


def answer_question(
    df: pd.DataFrame,
    question: str,
) -> dict:
    return analyze_question(
        df,
        question,
    )