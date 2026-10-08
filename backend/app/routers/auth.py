from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginIn, MeOut, RefreshIn, RegisterBusinessIn, TokenOut
from app.security import create_access_token, create_refresh_token, decode_token
from app.services import auth_services

router = APIRouter(prefix="/auth", tags=["auth"])

def _token_pair(user_id: int) -> TokenOut:
    return TokenOut(access_token = create_access_token(user_id), refresh_token = create_refresh_token(user_id))

@router.post("/register-business", response_model=TokenOut, status_code=201)
def register_business(data: RegisterBusinessIn, db: Session = Depends(get_db)):
    admin = auth_services.register_business(db, data)
    return _token_pair(admin.id)

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = auth_services.authenticate(db, data.email, data.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _token_pair(user.id)

@router.post("/refresh", response_model=TokenOut)
def refresh(data: RefreshIn, db: Session = Depends(get_db)):
    user_id = decode_token(data.refresh_token, 'refresh')
    if user_id is None or db.get(User, user_id) is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return TokenOut(access_token=create_access_token(user_id))

@router.get("/me", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return user