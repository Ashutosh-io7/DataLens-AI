import pandas as pd
import pytest
from app.services.ml_service import train_and_explain_model


@pytest.fixture
def ml_dataset():
    """Generates a multi-attribute dataset with both regression and classification targets."""
    return pd.DataFrame({
        "age": [25, 35, 45, 20, 50, 60, 30, 40, 22, 33, 44, 55],
        "experience": [1, 8, 15, 0, 22, 30, 5, 12, 1, 7, 14, 25],
        "income": [35.0, 65.0, 90.0, 28.0, 115.0, 140.0, 52.0, 80.0, 32.0, 60.0, 88.0, 125.0],
        "department": ["Sales", "Tech", "Tech", "Sales", "Exec", "Exec", "Sales", "Tech", "Sales", "Tech", "Tech", "Exec"],
        "promoted": [0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1],
    })


class TestMultiModelAutoML:
    """Verifies the multi-model machine learning leaderboard, task detection, and explainability."""

    def test_regression_leaderboard(self, ml_dataset):
        result = train_and_explain_model(ml_dataset, target_col="income")

        assert result["task"] == "regression"
        assert result["target"] == "income"
        assert len(result["leaderboard"]) >= 3

        # Check model IDs in leaderboard
        model_ids = [m["id"] for m in result["leaderboard"]]
        assert "linear" in model_ids
        assert "random_forest" in model_ids
        assert "xgboost" in model_ids

        # Check metrics on champion
        champion = result["champion"]
        assert "r2_score" in champion["metrics"]
        assert "rmse" in champion["metrics"]
        assert "mae" in champion["metrics"]

        # Check feature importance chart
        chart = result["shap_chart"]
        assert chart["type"] == "bar"
        assert chart["orientation"] == "horizontal"
        assert len(chart["data"]) > 0

    def test_classification_leaderboard(self, ml_dataset):
        result = train_and_explain_model(ml_dataset, target_col="promoted")

        assert result["task"] == "classification"
        assert result["target"] == "promoted"
        assert len(result["leaderboard"]) >= 3

        # Check model IDs in leaderboard
        model_ids = [m["id"] for m in result["leaderboard"]]
        assert "logistic" in model_ids
        assert "random_forest" in model_ids
        assert "xgboost" in model_ids

        # Check metrics on champion
        champion = result["champion"]
        assert "accuracy" in champion["metrics"]
        assert "f1_score" in champion["metrics"]

    def test_user_preferred_model_selection(self, ml_dataset):
        # Explicitly request Linear Regression
        result = train_and_explain_model(
            ml_dataset, target_col="income", preferred_model="linear"
        )
        assert result["champion"]["id"] == "linear"
        assert "Linear Regression" in result["champion"]["name"]

    def test_invalid_target_column_raises_error(self, ml_dataset):
        with pytest.raises(ValueError, match="not found in dataset"):
            train_and_explain_model(ml_dataset, target_col="non_existent_column")
