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
