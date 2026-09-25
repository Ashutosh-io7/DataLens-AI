from fastapi import status


class TestApiEndpoints:
    """Integration tests for FastAPI endpoints, routing, and request validation."""

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "DataLens AI API" in data["message"]

    def test_health_check_endpoint(self, client):
        response = client.get("/api/datasets/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "database" in data
        assert "llm_configured" in data

    def test_auth_signup_validation_invalid_email(self, client):
        response = client.post(
            "/api/auth/signup",
            json={"email": "not-a-valid-email", "password": "validPassword123"},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_auth_signup_validation_short_password(self, client):
        response = client.post(
            "/api/auth/signup",
            json={"email": "test@datalens.ai", "password": "123"},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_auth_me_requires_token(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_auth_me_rejects_invalid_token(self, client):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.fake.token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
