from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_role
from app.models import Role, User
from app.schemas import UserCreateIn, UserOut
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=list[UserOut])
def list_users(admin: User = Depends(require_role(Role.admin)), db: Session = Depends(get_db)):
    return user_service.list_users(db, admin)

@router.post("",response_model=UserOut, status_code=201)
def create_user(
    data: UserCreateIn,
    admin: User = Depends(require_role(Role.admin)),
    db: Session = Depends(get_db)
):
    return user_service.create_user(db, admin, data)