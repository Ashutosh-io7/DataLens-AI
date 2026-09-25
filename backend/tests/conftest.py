import os
import sys
import pandas as pd
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app


@pytest.fixture
def sample_df():
    """Provides a realistic sample dataset for query execution & analytics testing."""
    return pd.DataFrame({
        "category": ["Tech", "Furniture", "Office", "Tech", "Tech", "Office"],
        "region": ["North", "South", "East", "West", "North", "South"],
        "sales": [250.0, 150.0, 50.0, 400.0, 300.0, 75.0],
        "quantity": [2, 1, 5, 3, 2, 4],
        "profit": [50.0, -20.0, 10.0, 120.0, 90.0, 15.0],
        "date": [
            "2024-01-01",
            "2024-01-02",
            "2024-01-03",
            "2024-01-04",
            "2024-01-05",
            "2024-01-06",
        ],
    })


@pytest.fixture(scope="session")
def client():
    """Provides a FastAPI test client instance for integration testing."""
    return TestClient(app)
