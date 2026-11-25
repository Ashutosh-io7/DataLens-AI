import uuid
from datetime import datetime, timedelta, timezone
import pytest
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


class TestSecurityUtilities:
    """Verifies cryptographic password hashing and JWT token lifecycle."""

    def test_password_hashing_and_verification(self):
        plain_pw = "SuperSecret123!"
        hashed = hash_password(plain_pw)

        assert hashed != plain_pw
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
        assert verify_password(plain_pw, hashed) is True
        assert verify_password("WrongPassword!", hashed) is False

    def test_password_salting(self):
        plain_pw = "DeterministicCheck"
        hash_1 = hash_password(plain_pw)
        hash_2 = hash_password(plain_pw)

        assert hash_1 != hash_2, "Bcrypt must use a unique salt per hash operation"
        assert verify_password(plain_pw, hash_1) is True
        assert verify_password(plain_pw, hash_2) is True

    def test_access_token_creation_and_decoding(self):
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id)

        assert isinstance(token, str)
        assert len(token) > 20

        # Decode using application secret key
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        assert payload.get("sub") == user_id
        assert "exp" in payload

    def test_expired_token_rejection(self):
        user_id = str(uuid.uuid4())
        expired_time = datetime.now(timezone.utc) - timedelta(hours=1)
        expired_token = jwt.encode(
            {"sub": user_id, "exp": expired_time},
            settings.secret_key,
            algorithm=settings.jwt_algorithm,
        )

        with pytest.raises(JWTError):
            jwt.decode(
                expired_token,
                settings.secret_key,
                algorithms=[settings.jwt_algorithm],
            )

class TestChartIsolation:
    """Verifies that get_all_charts strictly scopes charts to the owning user."""

    def test_get_all_charts_isolates_by_user_id(self, tmp_path, monkeypatch):
        import json
        from app.services import conversation_service

        monkeypatch.setattr(settings, "data_dir", tmp_path)
        settings.conversations_dir.mkdir(parents=True, exist_ok=True)
        settings.metadata_dir.mkdir(parents=True, exist_ok=True)

        # Force fallback path so test runs offline without PostgreSQL
        def broken_session():
            raise RuntimeError("DB offline")
        monkeypatch.setattr(conversation_service, "SessionLocal", broken_session)

        user_a = str(uuid.uuid4())
        user_b = str(uuid.uuid4())
        ds_a = str(uuid.uuid4())
        ds_b = str(uuid.uuid4())

        for ds_id, owner, chart_title in [
            (ds_a, user_a, "User A Revenue"),
            (ds_b, user_b, "User B Confidential"),
        ]:
            (settings.metadata_dir / f"{ds_id}.json").write_text(
                json.dumps({"dataset_id": ds_id, "user_id": owner, "filename": f"{owner}.csv"}),
                encoding="utf-8",
            )
            (settings.conversations_dir / f"{ds_id}.json").write_text(
                json.dumps({
                    "dataset_id": ds_id,
                    "user_id": owner,
                    "messages": [
                        {"id": "1", "sender": "user", "text": "Plot chart"},
                        {"id": "2", "sender": "ai", "text": "Done", "chart": {"title": chart_title}},
                    ],
                }),
                encoding="utf-8",
            )

        charts_a = conversation_service.get_all_charts(limit=60, user_id=user_a)
        charts_b = conversation_service.get_all_charts(limit=60, user_id=user_b)

        assert [c["chart"]["title"] for c in charts_a] == ["User A Revenue"]
        assert [c["chart"]["title"] for c in charts_b] == ["User B Confidential"]