from typing import Annotated
import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User
from app.core.config import get_settings
from app.core.errors import fail

DB = Annotated[Session, Depends(get_db)]
bearer = HTTPBearer(auto_error=False)

def current_user(db: DB, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]):
    if credentials is None:
        fail(401, "Silakan login terlebih dahulu.", "AUTH_REQUIRED")
    settings = get_settings()
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm], options={"require": ["exp", "sub", "iat"]})
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, TypeError):
        fail(401, "Token tidak valid atau kedaluwarsa.", "TOKEN_INVALID")
    user = db.get(User, user_id)
    if user is None:
        fail(401, "Token tidak valid.", "TOKEN_INVALID")
    return user

CurrentUser = Annotated[User, Depends(current_user)]
