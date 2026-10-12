from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.models import Priority, Role, Status

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# auth
class RegisterBusinessIn(BaseModel):
    business_name: str = Field(min_length=2, max_length=120)
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class RefreshIn(BaseModel):
    refresh_token: str
    
class TokenOut(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"

# user
class BusinessOut(ORMModel):
    id: int
    name: str
    slug: str
    
class UserBrief(ORMModel):
    id: int
    name: str
    role: Role

class UserOut(UserBrief):
    email: EmailStr
    business_id: int
    created_at: datetime
    
class MeOut(UserOut):
    business: BusinessOut

class UserCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)
    role: Role
    
    @field_validator('role')
    @classmethod
    def only_agent_or_customer(cls, value: Role) -> Role:
        if value == Role.admin:
            raise ValueError("role must be agent or customer")
        return value

# tickets & messages
class TicketCreateIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    
    subject: str = Field(min_length=3, max_length=255)
    category: str = Field(min_length=2, max_length=100)
    priority: Priority = Priority.medium
    message: str = Field(min_length=1, max_length=5000)
    
class TicketUpdateIn(BaseModel):
    status: Status | None = None
    assigned_agent_id: int | None = None
    
class TicketOut(ORMModel):
    id: int
    subject: str
    category: str
    priority: Priority
    status: Status
    customer: UserBrief
    assigned_agent: UserBrief | None = None
    created_at: datetime
    updated_at: datetime
    
class MessageOut(BaseModel):
    id: int
    ticket_id: int
    sender_id : int
    sender_name : str
    sender_role : Role
    body: str
    created_at: datetime

