from fastapi import APIRouter, Depends, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_role
from app.models import Role, Status, User
from app.schemas import MessageOut, TicketCreateIn, TicketOut, TicketUpdateIn
from app.services import ticket_service
from app.ws_manager import manager

router = APIRouter(prefix='/tickets', tags=['tickets'])

@router.get('', response_model=list[TicketOut])
def list_tickets(
    status: Status | None = Query(default=None), user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
    return ticket_service.list_tickets(db, user, status)

@router.post('', response_model=TicketOut, status_code=201)
def create_ticket(
    data: TicketCreateIn,
    user: User = Depends(require_role(Role.customer)),db: Session = Depends(get_db),
):
    return ticket_service.create_ticket(db, user, data)

@router.get('/{ticket_id}', response_model=TicketOut)
def get_ticket(ticket_id: int, user: User = Depends(get_current_user), db:
    Session = Depends(get_db)):
    return ticket_service.get_ticket_for_user(db, ticket_id, user)

@router.get('/{ticket_id}/messages', response_model=list[MessageOut])
def get_messages(ticket_id: int, user: User = Depends(get_current_user), db:
    Session = Depends(get_db)):
    ticket = ticket_service.get_ticket_for_user(db, ticket_id, user)
    return ticket_service.list_messages(db, ticket)

@router.patch('/{ticket_id}', response_model=TicketOut)
async def update_ticket(
    ticket_id: int,
    data: TicketUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    ticket = await run_in_threadpool(ticket_service.update_ticket, db,ticket_id, user, data)
    await manager.broadcast(ticket_id, {'type': 'ticket_updated', 'data': ticket.model_dump(mode='json')})
    return ticket