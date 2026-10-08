from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import UserCreateIn
from app.security import hash_password
from app.services.auth_service import email_taken

def list_users(db: Session, admin: User) -> list[User]:
    stmt = select(User).where(User.business_id == admin.business_id).order_by(User.created_at)
    return list(db.scalars(stmt).all())

def create_user(db: Session, admin: User, data: UserCreateIn) -> User:
    email = data.email.lower()
    if email_taken(db, email):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        business_id=admin.business_id,
        name=data.name,
        email=email,
        password_hash=hash_password(data.password),
        role=data.role
    )
    db.add(user)
    db.commit()
    return user