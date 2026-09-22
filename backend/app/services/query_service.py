from __future__ import annotations

import re
from typing import Any
import pandas as pd

from app.services.analysis_service import analyze_question

_STARTER = r"(?:which|what|how many|how much|who|show|list|when)"
_SPLIT_PATTERN = re.compile(
    rf"\?\s*(?:and|,)?\s*|\s+and\s+(?={_STARTER}\b)",
    re.IGNORECASE,
)


def _split_compound_question(question: str) -> list[str]:
    """Splits a message like 'Which car is least driven? and which car is
    the most driven?' into separate, independently-answerable questions.
    Deliberately conservative: only splits when every resulting piece
    clearly starts with a question word, so it never breaks a normal
    single question that just happens to contain the word 'and'."""
    parts = [p.strip(" ?,.") for p in _SPLIT_PATTERN.split(question) if p.strip(" ?,.")]
    if len(parts) < 2:
        return [question]

    starter_re = re.compile(rf"^{_STARTER}\b", re.IGNORECASE)
    if not all(starter_re.match(p) for p in parts):
        return [question]

    return parts[:3]  # cap at 3 sub-questions so the reply stays readable


def _merge_results(results: list[dict[str, Any]]) -> dict[str, Any]:
    numbered_answers = [f"{i + 1}. {r['answer']}" for i, r in enumerate(results)]
    chart = next((r.get("chart") for r in results if r.get("chart")), None)
    explanations = [r["explanation"] for r in results if r.get("explanation")]

    follow_ups: list[str] = []
    for r in results:
        for f in r.get("suggested_follow_ups", []):
            if f not in follow_ups:
                follow_ups.append(f)

    return {
        "answer": "\n".join(numbered_answers),
        "chart": chart,
        "explanation": " / ".join(explanations) or None,
        "suggested_follow_ups": follow_ups[:4],
        "analysis_type": "compound",
        "planned_by": "/".join(r.get("planned_by", "rule_based") for r in results),
        "plan": results[0].get("plan"),  # keep follow-up context anchored to the first part
    }


def answer_question(
    df: pd.DataFrame,
    question: str,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    sub_questions = _split_compound_question(question)

    if len(sub_questions) == 1:
        return analyze_question(df, question, context=context)

    results = [analyze_question(df, q, context=context) for q in sub_questions]
    return _merge_results(results)