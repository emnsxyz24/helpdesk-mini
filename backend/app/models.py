import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Role(str, enum.Enum):
    admin = 'admin'
    agent = 'agent'
    customer = 'customer'
    
class Priority(str, enum.Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'
    
class Status(str, enum.Enum):
    open = 'open'
    in_progress = 'in_progress'
    resolved = 'resolved'
    closed = 'closed'
    
class Business(Base):
    __tablename__ = 'businesses'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class User(Base):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey('businesses.id'), index=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role, name='role'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    business: Mapped[Business] = relationship()
    
class Ticket(Base):
    __tablename__ = 'tickets'
    __table_args__ = (Index('ix_tickets_business_id_status', 'business_id', 'status'),)
    
    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey('businesses.id'))
    customer_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    assigned_agent_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True)
    subject: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100))
    priority: Mapped[Priority] = mapped_column(Enum(Priority, name='priority'), default=Priority.medium)
    status: Mapped[Status] = mapped_column(Enum(Status, name='status'), default=Status.open)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    customer: Mapped[User] = relationship(foreign_keys=[customer_id])
    assigned_agent: Mapped[User | None] = relationship(foreign_keys=[assigned_agent_id])
    
class Message(Base):
    __tablename__ = 'messages'
    __table_args__ = (Index('ix_messages_ticket_id_created_at', 'ticket_id', 'created_at'),)
    
    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey('tickets.id'))
    sender_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    
    sender: Mapped[User] = relationship()