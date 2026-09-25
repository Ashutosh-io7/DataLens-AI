import pytest
import pandas as pd
from app.services.code_executor import is_safe_code, execute_pandas_query


class TestSandboxSecurity:
    """Validates the strict AST-based security sandbox protecting the pandas engine."""

    @pytest.mark.parametrize(
        "malicious_code, expected_pattern",
        [
            ("import os", "Import"),
            ("from math import sqrt", "ImportFrom"),
            ("__import__('os').system('dir')", "approved method list"),
            ("eval('2 + 2')", "Calling 'eval' is not permitted"),
            ("exec('x = 1')", "Calling 'exec' is not permitted"),
            ("open('secret.txt', 'w')", "Calling 'open' is not permitted"),
            ("df.__class__.__subclasses__()", "is not permitted"),
            ("df._data", "Access to '_data' is not permitted"),
            ("df.to_csv('leak.csv')", "'to_csv' is not on the approved method list"),
            ("df.to_sql('table', con)", "'to_sql' is not on the approved method list"),
            ("df.to_pickle('data.pkl')", "'to_pickle' is not on the approved method list"),
            ("def hack(): pass", "'FunctionDef' is not permitted"),
            ("lambda x: x + 1", "'Lambda' is not permitted"),
        ],
    )
    def test_blocks_dangerous_constructs(self, malicious_code, expected_pattern):
        safe, reason = is_safe_code(malicious_code)
        assert safe is False, f"Code should be rejected as unsafe: {malicious_code}"
        assert expected_pattern.lower() in reason.lower()

    @pytest.mark.parametrize(
        "valid_code",
        [
            "df['sales'].mean()",
            "df['sales'].sum()",
            "df.groupby('category')['sales'].sum().reset_index()",
            "df.sort_values(by='sales', ascending=False).head(5)",
            "df[df['sales'] > 100]",
            "len(df)",
            "round(df['sales'].std(), 2)",
            "df['category'].value_counts()",
            "df.describe()",
        ],
    )
    def test_allows_valid_analytics_code(self, valid_code):
        safe, reason = is_safe_code(valid_code)
        assert safe is True, f"Valid analytics code was falsely rejected: {reason}"


class TestSandboxExecution:
    """Verifies that allowed pandas code executes deterministically against the data."""

    def test_executes_scalar_query(self, sample_df):
        code = "df['sales'].sum()"
        result = execute_pandas_query(code, sample_df)
        assert result == 1225.0

    def test_executes_aggregation_query(self, sample_df):
        code = "df.groupby('category')['sales'].sum()"
        result = execute_pandas_query(code, sample_df)
        assert isinstance(result, pd.Series)
        assert result["Tech"] == 950.0

    def test_executes_filtered_query(self, sample_df):
        code = "len(df[df['sales'] >= 300])"
        result = execute_pandas_query(code, sample_df)
        assert result == 2

    def test_blocks_execution_of_unsafe_code(self, sample_df):
        with pytest.raises(ValueError, match="Security validation error"):
            execute_pandas_query("import sys", sample_df)
