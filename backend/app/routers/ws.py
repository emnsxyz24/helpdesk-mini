import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from app.database import SessionLocal
from app.models import User
from app.security import decode_token
from app.services import ticket_service
from app.ws_manager import manager

router = APIRouter(tags=["realtime"])

def _authorize(token: str, ticket_id: int) -> int | None:
    user_id = decode_token(token, 'access')
    if user_id is None:
        return None
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user is None:
            return None
        try:
            ticket_service.get_ticket_for_user(db, ticket_id, user)
        except HTTPException:
            return None
        return user.id

def _save_message(user_id: int, ticket_id: int, body: str) -> None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User no longer exists")
        ticket = ticket_service.get_ticket_for_user(db, ticket_id, user)
        message = ticket_service.add_message(db, ticket, user, body)
        return {"type": "message", "data": ticket_service.to_message_out(message).model_dump(mode='json')}
    
@router.websocket("/ws/tickets/{ticket_id}")
async def ticket_socket(websocket: WebSocket, ticket_id: int, token: str = Query(...)):
    user_id = await run_in_threadpool(_authorize, token, ticket_id)
    if user_id is None:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    manager.connect(ticket_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                body = str(json.loads(data).get("body", "")).strip()
            except (ValueError, AttributeError):
                body = ""
            if not body or len(body) > 5000:
                await websocket.send_json({"type": "error", "message": "Message must be 1-5000 characters long"})
                continue
            try:
                event = await run_in_threadpool(_save_message, user_id, ticket_id, body)
            except HTTPException as exc:
                await websocket.send_json({"type": "error", "message": exc.detail})
                continue
            await manager.broadcast(ticket_id, event)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(ticket_id, websocket)