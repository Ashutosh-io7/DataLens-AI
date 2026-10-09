import pandas as pd
import pytest

from app.services.query_planner import plan_query


@pytest.fixture
def fifa_df():
    return pd.DataFrame([
        {
            "team": "Argentina",
            "team_code": "ARG",
            "association": "CONMEBOL",
            "rank": 1,
            "previous_rank": 3,
            "points": 1876.11,
            "previous_points": 1874.81,
            "rated_matches": 59,
        },
        {
            "team": "Spain",
            "team_code": "ESP",
            "association": "UEFA",
            "rank": 2,
            "previous_rank": 2,
            "points": 1873.01,
            "previous_points": 1876.39,
            "rated_matches": 56,
        },
        {
            "team": "France",
            "team_code": "FRA",
            "association": "UEFA",
            "rank": 3,
            "previous_rank": 1,
            "points": 1869.42,
            "previous_points": 1877.32,
            "rated_matches": 57,
        },
        {
            "team": "England",
            "team_code": "ENG",
            "association": "UEFA",
            "rank": 4,
            "previous_rank": 4,
            "points": 1827.04,
            "previous_points": 1825.96,
            "rated_matches": 57,
        },
    ])


@pytest.fixture
def cars_df():
    return pd.DataFrame({
        "Selling_Price": [5.0, 10.0, 3.5, 8.0],
        "Fuel_Type": ["Petrol", "Diesel", "CNG", "Petrol"],
        "Transmission": ["Manual", "Automatic", "Manual", "Automatic"],
        "Year": [2015, 2018, 2012, 2019],
    })


class TestFifaAndAnalyticalQueryRouting:
    def test_top_10_countries_is_not_trapped_by_value_counts(self, fifa_df):
        """'Which are the Top 10 Best Countries' must not be trapped by frequency value_counts."""
        plan = plan_query("Which are the Top 10 Best Countries in FIFA World Cup ?", fifa_df)
        assert plan.get("intent") != "value_counts"
        assert plan.get("intent") == "unsupported"  # Escalates to LLM

    def test_rank_1_filter_is_not_trapped_by_mean_aggregation(self, fifa_df):
        """'Which countries have achieved rank 1 ?' must not default to mean(rank)."""
        plan = plan_query("Which countries have achieved rank 1 ?", fifa_df)
        assert plan.get("intent") != "aggregation"
        assert plan.get("intent") == "unsupported"  # Escalates to LLM

    def test_metric_lookup_with_category_is_not_trapped_by_row_count(self, fifa_df):
        """'How many points France have ?' must not be trapped as filter_count(team='France')."""
        plan = plan_query("How many points France have ?", fifa_df)
        assert plan.get("intent") != "filter_count"
        assert plan.get("intent") == "unsupported"  # Escalates to LLM

    def test_deterministic_queries_still_work(self, fifa_df):
        """Unambiguous structural questions must continue to be handled deterministically."""
        assert plan_query("How many rows are in the dataset?", fifa_df)["intent"] == "row_count"
        assert plan_query("What columns are there?", fifa_df)["intent"] == "column_list"
        assert plan_query("Are there missing values?", fifa_df)["intent"] == "missing_values"
        assert plan_query("Are there duplicate rows?", fifa_df)["intent"] == "duplicate_count"
        assert plan_query("Summary statistics", fifa_df)["intent"] == "summary_statistics"
        assert plan_query("What is this dataset about?", fifa_df)["intent"] == "dataset_summary"
        assert plan_query("Correlation between rank and points", fifa_df)["intent"] == "correlation"
        assert plan_query("What is the average points?", fifa_df)["intent"] == "aggregation"
        assert plan_query("How many UEFA teams are there?", fifa_df)["intent"] == "filter_count"


class TestMultiTurnContextPollution:
    def test_subsequent_analytical_question_does_not_inherit_previous_target(self, cars_df):
        """Question 2 (e.g. 'Why are some cars priced higher?') must not be forced into mean(Selling_Price)."""
        ctx = {"target_column": "Selling_Price", "group_column": None, "intent": "aggregation"}
        plan = plan_query("Why are some cars priced higher?", cars_df, context=ctx)
        assert plan.get("intent") != "aggregation"
        assert plan.get("intent") == "unsupported"

    def test_explicit_pronoun_follow_up_inherits_context(self, cars_df):
        """Question 2 with explicit pronoun ('Distribution of that') should inherit the target column."""
        ctx = {"target_column": "Selling_Price", "group_column": None, "intent": "aggregation"}
        plan = plan_query("Distribution of that", cars_df, context=ctx)
        assert plan.get("intent") == "distribution"
        assert plan.get("target_column") == "Selling_Price"
