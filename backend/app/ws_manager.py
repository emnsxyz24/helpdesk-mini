from collections import defaultdict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[int, set[WebSocket]] = defaultdict(set)
    
    def connect(self, ticket_id: int, ws: WebSocket) -> None:
        self.rooms[ticket_id].add(ws)
    
    def disconnect(self, ticket_id: int, ws: WebSocket) -> None:
        self.rooms[ticket_id].discard(ws)
        if not self.rooms[ticket_id]:
            del self.rooms[ticket_id]
    
    async def broadcast(self, ticket_id: int, event: dict) -> None:
        for ws in list(self.rooms.get(ticket_id, [])):
            try:
                await ws.send_json(event)
            except Exception:
                self.disconnect(ticket_id, ws)

manager = ConnectionManager()