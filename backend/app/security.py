from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.config import settings

ALGORITHM = "HS256"
_hasher = PasswordHasher()

def hash_password(password: str) -> str:
    return _hasher.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return _hasher.verify(hashed_password, password)
    except VerifyMismatchError:
        return False

def _make_token(user_id: int, token_type: str, lifetime: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + lifetime,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)

def create_access_token(user_id: int) -> str:
    return _make_token(user_id, "access", timedelta(minutes=settings.access_token_minutes))

def create_refresh_token(user_id: int) -> str:
    return _make_token(user_id, "refresh", timedelta(days=settings.refresh_token_days))

def decode_token(token: str, expected_type: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        if payload.get('type') != expected_type:
            return None
        return int(payload['sub'])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None