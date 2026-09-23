from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login") 

def hash_password(password: str) -> str: 
    """Turns a plain password into a one-way hash that's safe to store.""" 
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8") 

def verify_password(plain_password: str, hashed_password: str) -> bool: 
    """Checks a login attempt's password against the stored hash.""" 
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8")) 

def create_access_token(user_id: str) -> str: 
    """Issues a signed token proving who the user is, valid for a limited time.""" 
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes) 
    payload = {"sub": user_id, "exp": expire} 
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm) 

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: reads the Bearer token from the request, verifies
    it, and returns the logged-in User — or rejects the request with 401."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise unauthorized
    except JWTError:
        raise unauthorized

    try:
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    except ValueError:
        raise unauthorized
    if user is None:
        raise unauthorized
    return user 