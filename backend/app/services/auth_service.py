import re

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Business, User, Role
from app.schemas import RegisterBusinessIn
from app.security import hash_password, verify_password

def _unique_slug(db: Session, name: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or 'business'
    slug, n = base, 2
    while db.scalar(select(Business).where(Business.slug == slug)) is not None:
        slug = f"{base}-{n}"
        n += 1
    return slug

def email_taken(db: Session, email: str) -> bool:
    return db.scalar(select(User).where(User.email == email)) is not None

def register_business(db: Session, data: RegisterBusinessIn) -> User:
    email = data.email.lower()
    if email_taken(db, email):
        raise HTTPException(status_code=409, detail="Email already registered")
    business = Business(name=data.business_name, slug=_unique_slug(db, data.business_name))
    admin = User(
        business=business,
        name=data.name,
        email=email,
        password_hash=hash_password(data.password),
        role=Role.admin,
    )
    db.add(admin)
    db.commit()
    return admin

def authenticate(db: Session, email: str, password: str) -> User | None:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user