from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.database.models import User
from app.core.errors import fail
from app.core.security import hasher, verify_password, create_token, DUMMY_HASH

def register(db, data):
    user = User(username=data.username, email=str(data.email), password_hash=hasher.hash(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        fail(409, "Email sudah terdaftar.", "EMAIL_DUPLICATE")
    return user

def login(db, data):
    user = db.scalar(select(User).where(User.email == str(data.email)))
    valid = verify_password(data.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        fail(401, "Email atau password salah.", "LOGIN_INVALID")
    return {"token": create_token(user.id), "user": user}
