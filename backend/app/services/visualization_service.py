from __future__ import annotations

from typing import Any


def _chart(
    chart_type: str,
    title: str,
    data: list[dict[str, Any]],
    x_field: str,
    y_field: str,
    x_label: str,
    y_label: str,
    orientation: str | None = None,
    reason: str | None = None, 
) -> dict[str, Any]:
    result = {
        "type": chart_type,
        "title": title,
        "data": data,
        "x_field": x_field,
        "y_field": y_field,
        "x_label": x_label,
        "y_label": y_label,
    }

    if orientation:
        result["orientation"] = orientation 

    if reason:
        result["reason"] = reason 

    return result 


def choose_value_counts_chart(
    column: str,
    values: list[dict[str, Any]],
) -> dict[str, Any]:
    total = sum(
        item["value"]
        for item in values
    )

    unique_values = len(values)

    if total > 0 and unique_values <= 5:
        return _chart(
            chart_type="pie",
            title=f"{column} distribution",
            data=values,
            x_field="label",
            y_field="value",
            x_label=column,
            y_label="Count",
        )

    return value_counts_chart(
        column,
        values,
    )


def value_counts_chart(
    column: str,
    values: list[dict[str, Any]],
) -> dict[str, Any]:
    return _chart(
        chart_type="bar",
        title=f"Top values in {column}",
        data=values,
        x_field="label",
        y_field="value",
        x_label=column,
        y_label="Count",
        orientation="horizontal",
    )


def category_count_chart(
    column: str,
    value: str,
    count: int,
) -> dict[str, Any]:
    return _chart(
        chart_type="bar",
        title=f"{value} count",
        data=[{"label": value, "value": count}],
        x_field="label",
        y_field="value",
        x_label=column,
        y_label="Count",
    )


def grouped_chart(
    group_column: str,
    values: list[dict[str, Any]],
    value_label: str,
    temporal: bool = False,
) -> dict[str, Any]:
    chart_type = "line" if temporal else "bar"

    return _chart(
        chart_type=chart_type,
        title=f"{value_label} by {group_column}",
        data=values,
        x_field="label",
        y_field="value",
        x_label=group_column,
        y_label=value_label,
        orientation="horizontal" if chart_type == "bar" else None,
    )


def histogram_chart(
    column: str,
    values: list[dict[str, Any]],
) -> dict[str, Any]:
    return _chart(
        chart_type="histogram",
        title=f"Distribution of {column}",
        data=values,
        x_field="label",
        y_field="value",
        x_label=column,
        y_label="Count",
    )


def missing_values_chart(
    values: list[dict[str, Any]],
) -> dict[str, Any]:
    return _chart(
        chart_type="bar",
        title="Missing values by column",
        data=values,
        x_field="label",
        y_field="value",
        x_label="Column",
        y_label="Missing values",
        orientation="horizontal",
    )


def scatter_chart(
    x_column: str,
    y_column: str,
    points: list[dict[str, Any]],
) -> dict[str, Any]:
    return _chart(
        chart_type="scatter",
        title=f"{y_column} vs {x_column}",
        data=points,
        x_field="x",
        y_field="y",
        x_label=x_column,
        y_label=y_column,
    )