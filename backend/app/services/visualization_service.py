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
    result: dict[str, Any] = {
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
    total = sum(item.get("value", 0) for item in values if isinstance(item.get("value"), (int, float)))
    unique_values = len(values)

    if total > 0 and 2 <= unique_values <= 5:
        return _chart(
            chart_type="pie",
            title=f"{column} Distribution",
            data=values,
            x_field="label",
            y_field="value",
            x_label=column,
            y_label="Count",
            reason=f"Used pie/donut chart because {column} has few categories ({unique_values}).",
        )

    return value_counts_chart(column, values)


def value_counts_chart(
    column: str,
    values: list[dict[str, Any]],
) -> dict[str, Any]:
    return _chart(
        chart_type="bar",
        title=f"Top Categories in {column}",
        data=values,
        x_field="label",
        y_field="value",
        x_label=column,
        y_label="Count",
        orientation="horizontal" if len(values) > 5 else "vertical",
    )


def category_count_chart(
    column: str,
    value: str,
    count: int,
) -> dict[str, Any]:
    return _chart(
        chart_type="bar",
        title=f"Frequency of '{value}' in {column}",
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
        orientation="horizontal" if (chart_type == "bar" and len(values) > 6) else None,
        reason="Line chart chosen for time-based trend analysis." if temporal else None,
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
        x_label=f"{column} Ranges",
        y_label="Frequency",
        reason=f"Histogram grouped into intervals to visualize the spread of {column}.",
    )


def missing_values_chart(
    values: list[dict[str, Any]],
) -> dict[str, Any]:
    return _chart(
        chart_type="bar",
        title="Missing Values by Column",
        data=values,
        x_field="label",
        y_field="value",
        x_label="Column",
        y_label="Missing Count",
        orientation="horizontal",
    )


def scatter_chart(
    x_column: str,
    y_column: str,
    points: list[dict[str, Any]],
) -> dict[str, Any]:
    return _chart(
        chart_type="scatter",
        title=f"{y_column} vs. {x_column}",
        data=points,
        x_field="x",
        y_field="y",
        x_label=x_column,
        y_label=y_column,
        reason=f"Scatter plot chosen to inspect numeric correlation between {x_column} and {y_column}.",
    )


def correlation_chart(
    matrix_data: list[dict[str, Any]],
    metric_name: str,
) -> dict[str, Any]:
    return _chart(
        chart_type="bar",
        title=f"Correlations with {metric_name}",
        data=matrix_data,
        x_field="label",
        y_field="value",
        x_label="Feature",
        y_label="Pearson Correlation",
        orientation="horizontal",
    )
