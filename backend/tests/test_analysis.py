from app.services.visualization_service import (
    choose_value_counts_chart,
    value_counts_chart,
    grouped_chart,
    histogram_chart,
    scatter_chart,
    correlation_chart,
)


class TestVisualizationFormatting:
    """Verifies that the chart generation engine outputs correct Recharts payloads."""

    def test_choose_value_counts_chart_pie_for_few_categories(self):
        values = [
            {"label": "Male", "value": 50},
            {"label": "Female", "value": 50},
            {"label": "Other", "value": 5},
        ]
        chart = choose_value_counts_chart("Gender", values)

        assert chart["type"] == "pie"
        assert chart["x_field"] == "label"
        assert chart["y_field"] == "value"
        assert len(chart["data"]) == 3

    def test_choose_value_counts_chart_bar_for_many_categories(self):
        values = [
            {"label": f"Cat_{i}", "value": i * 10}
            for i in range(8)
        ]
        chart = choose_value_counts_chart("Categories", values)

        assert chart["type"] == "bar"
        assert chart["orientation"] == "horizontal"
        assert len(chart["data"]) == 8

    def test_grouped_chart_temporal_uses_line(self):
        values = [
            {"label": "2024-01-01", "value": 100},
            {"label": "2024-01-02", "value": 150},
        ]
        chart = grouped_chart("date", values, "Revenue", temporal=True)

        assert chart["type"] == "line"
        assert "Line chart chosen" in chart.get("reason", "")

    def test_grouped_chart_non_temporal_uses_bar(self):
        values = [
            {"label": "North", "value": 300},
            {"label": "South", "value": 450},
        ]
        chart = grouped_chart("region", values, "Revenue", temporal=False)

        assert chart["type"] == "bar"

    def test_histogram_chart_structure(self):
        bins = [
            {"label": "0-50", "value": 12},
            {"label": "50-100", "value": 28},
            {"label": "100-150", "value": 15},
        ]
        chart = histogram_chart("sales", bins)

        assert chart["type"] == "histogram"
        assert chart["title"] == "Distribution of sales"
        assert chart["data"] == bins

    def test_scatter_chart_structure(self):
        points = [
            {"x": 10, "y": 20},
            {"x": 20, "y": 40},
            {"x": 30, "y": 55},
        ]
        chart = scatter_chart("marketing_spend", "sales", points)

        assert chart["type"] == "scatter"
        assert chart["x_field"] == "x"
        assert chart["y_field"] == "y"
        assert chart["data"] == points
