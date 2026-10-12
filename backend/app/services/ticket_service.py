from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Message, Role, Status, Ticket, User, utcnow
from app.schemas import MessageOut, TicketCreateIn, TicketOut, TicketUpdateIn

TRANSITIONS: dict[Status, set[Status]] = {
    Status.open: {Status.in_progress},
    Status.in_progress: {Status.resolved},
    Status.resolved: {Status.closed, Status.open},
    Status.closed: set(),
}

def get_ticket_for_user(db: Session, ticket_id: int, user: User) -> Ticket:
    stmt = select(Ticket).where(Ticket.id == ticket_id, Ticket.business_id == user.business_id)
    if user.role == Role.customer:
        stmt = stmt.where(Ticket.customer_id == user.id)
    ticket = db.scalar(stmt)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

def list_tickets(db: Session, user: User, status: Status | None) -> list[Ticket]:
    stmt = select(Ticket).where(Ticket.business_id == user.business_id)
    if user.role == Role.customer:
        stmt = stmt.where(Ticket.customer_id == user.id)
    if status is not None:
        stmt = stmt.where(Ticket.status == status)
    stmt = stmt.options(selectinload(Ticket.customer), selectinload(Ticket.assigned_agent))
    return db.scalars(stmt.order_by(Ticket.updated_at.desc())).all()

def create_ticket(db: Session, customer: User, data: TicketCreateIn) -> Ticket:
    ticket = Ticket(
        business_id=customer.business_id,
        customer_id=customer.id,
        subject=data.subject,
        category=data.category,
        priority=data.priority,
    )
    db.add(ticket)
    db.flush()
    db.add(Message(ticket_id=ticket.id, sender_id=customer.id, body=data.message))
    db.commit()
    return ticket


def to_message_out(message: Message) -> MessageOut:
    return MessageOut(
        id=message.id,
        ticket_id=message.ticket_id,
        sender_id=message.sender_id,
        sender_name=message.sender.name,
        sender_role=message.sender.role,
        body=message.body,
        created_at=message.created_at,
    )
    
def list_messages(db: Session, ticket: Ticket) -> list[MessageOut]:
    stmt = (
        select(Message)
        .where(Message.ticket_id == ticket.id)
        .options(joinedload(Message.sender))
        .order_by(Message.created_at)
    )
    return [to_message_out(message) for message in db.scalars(stmt).all()]

def add_message(db: Session, ticket: Ticket, sender: User, body: str) -> Message:
    if ticket.status == Status.closed:
      raise HTTPException(status_code=409, detail="This ticket is closed")
    if sender.role == Role.admin:
      raise HTTPException(status_code=403, detail="Admins cannot send messages")
    message = Message(ticket_id=ticket.id, sender_id=sender.id, body=body)
    ticket.updated_at = utcnow()
    db.add(message)
    db.commit()
    return message

def _assign(db: Session, ticket: Ticket, actor: User, agent_id: int | None) -> None:
    if actor.role == Role.customer:
        raise HTTPException(status_code=403, detail="Only agents can assign tickets")
    if actor.role == Role.agent:
        if agent_id != actor.id:
            raise HTTPException(status_code=403, detail="Agents can only assign tickets to themselves")
        if ticket.assigned_agent_id not in (None, actor.id):
            raise HTTPException(status_code=409, detail="This ticket is already assigned to another agent")
    elif agent_id is not None:
        agent = db.scalar(
            select(User).where(User.id == agent_id, User.business_id == actor.business_id, User.role == Role.agent)
        )
        if agent is None:
            raise HTTPException(status_code=404, detail="Agent not found")
    ticket.assigned_agent_id = agent_id
    if agent_id is not None and ticket.status == Status.open:
        ticket.status = Status.in_progress
            
def _change_status(ticket: Ticket, actor: User, new_status: Status) -> None:
    if new_status == ticket.status:
        return
    if new_status not in TRANSITIONS[ticket.status]:
        raise HTTPException(status_code=409, detail=f"Cannot change ticket's status from {ticket.status.value} to {new_status.value}")
    is_reopen = ticket.status == Status.resolved and new_status == Status.open
    if is_reopen and actor.role != Role.customer:
        raise HTTPException(status_code=403, detail="Only customers can reopen tickets")
    if not is_reopen and actor.role == Role.customer:
        raise HTTPException(status_code=403, detail="Only agents can change ticket's status")
    ticket.status = new_status
    if new_status == Status.in_progress and ticket.assigned_agent_id is None and actor.role == Role.agent:
        ticket.assigned_agent_id = actor.id
        
def update_ticket(db: Session, ticket_id: int, actor: User, data: TicketUpdateIn) -> TicketOut:
    ticket = get_ticket_for_user(db, ticket_id, actor)
    if not data.model_fields_set & {"status", "assigned_agent_id"}:
        raise HTTPException(status_code=422, detail="Nothing to update")
    if ticket.status == Status.closed:
        raise HTTPException(status_code=409, detail="This ticket is closed")
    if "assigned_agent_id" in data.model_fields_set:
        _assign(db, ticket, actor, data.assigned_agent_id)
    if "status" in data.model_fields_set:
        _change_status(ticket, actor, data.status)
    ticket.updated_at = utcnow()
    db.commit()
    return TicketOut.model_validate(ticket)