"""Real-time WebSocket Manager for SIHAT Support Chats.
Broadcasts instant new messages, status updates, and notifications without polling.
"""

from collections import defaultdict
import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select

from sihat.config import get_settings
from sihat.db import async_session_factory
from sihat.models import SupportMessage, SupportTicket, User
from sihat.security import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websockets"])


class ConnectionManager:
    def __init__(self) -> None:
        # ticket_id -> set of active WebSockets in this ticket's chat room
        self.ticket_rooms: dict[str, set[WebSocket]] = defaultdict(set)
        # Global admin sockets (receives all support notifications and new tickets)
        self.admin_sockets: set[WebSocket] = set()
        # user_id -> set of WebSockets
        self.user_sockets: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect_ticket(
        self, websocket: WebSocket, ticket_id: str, user_id: str | None, is_admin: bool
    ) -> None:
        await websocket.accept()
        self.ticket_rooms[ticket_id].add(websocket)
        if user_id:
            self.user_sockets[user_id].add(websocket)
        if is_admin:
            self.admin_sockets.add(websocket)
        logger.info(
            "WS client connected to ticket %s (user: %s, admin: %s)",
            ticket_id,
            user_id,
            is_admin,
        )

    def disconnect_ticket(
        self, websocket: WebSocket, ticket_id: str, user_id: str | None, is_admin: bool
    ) -> None:
        self.ticket_rooms[ticket_id].discard(websocket)
        if not self.ticket_rooms[ticket_id]:
            self.ticket_rooms.pop(ticket_id, None)
        if user_id:
            self.user_sockets[user_id].discard(websocket)
            if not self.user_sockets[user_id]:
                self.user_sockets.pop(user_id, None)
        if is_admin:
            self.admin_sockets.discard(websocket)
        logger.info("WS client disconnected from ticket %s", ticket_id)

    async def connect_global(
        self, websocket: WebSocket, user_id: str | None, is_admin: bool
    ) -> None:
        await websocket.accept()
        if is_admin:
            self.admin_sockets.add(websocket)
        if user_id:
            self.user_sockets[user_id].add(websocket)
        logger.info("WS global connection (user: %s, admin: %s)", user_id, is_admin)

    def disconnect_global(
        self, websocket: WebSocket, user_id: str | None, is_admin: bool
    ) -> None:
        if is_admin:
            self.admin_sockets.discard(websocket)
        if user_id:
            self.user_sockets[user_id].discard(websocket)
            if not self.user_sockets[user_id]:
                self.user_sockets.pop(user_id, None)
        logger.info("WS global disconnected (user: %s)", user_id)

    async def broadcast_new_message(
        self,
        ticket_id: str,
        message: dict[str, Any],
        ticket: dict[str, Any] | None = None,
        recipient_user_id: str | None = None,
    ) -> None:
        payload = {
            "event": "new_message",
            "ticket_id": ticket_id,
            "message": message,
            "ticket": ticket,
        }
        raw = json.dumps(payload, ensure_ascii=False)

        # 1. Send to all sockets currently in this ticket's chat room
        room = list(self.ticket_rooms.get(ticket_id, set()))
        for ws in room:
            try:
                await ws.send_text(raw)
            except Exception:
                self.ticket_rooms[ticket_id].discard(ws)

        # 2. Send to global admins
        admins = list(self.admin_sockets)
        for ws in admins:
            if ws not in room:  # avoid duplicate send if admin is already in room
                try:
                    await ws.send_text(raw)
                except Exception:
                    self.admin_sockets.discard(ws)

        # 3. Send to recipient user if outside the room
        if recipient_user_id and recipient_user_id in self.user_sockets:
            user_conns = list(self.user_sockets[recipient_user_id])
            for ws in user_conns:
                if ws not in room:
                    try:
                        await ws.send_text(raw)
                    except Exception:
                        self.user_sockets[recipient_user_id].discard(ws)

    async def broadcast_ticket_update(
        self,
        ticket_id: str,
        ticket: dict[str, Any],
        recipient_user_id: str | None = None,
    ) -> None:
        payload = {
            "event": "ticket_updated",
            "ticket_id": ticket_id,
            "ticket": ticket,
        }
        raw = json.dumps(payload, ensure_ascii=False)

        # Room sockets
        room = list(self.ticket_rooms.get(ticket_id, set()))
        for ws in room:
            try:
                await ws.send_text(raw)
            except Exception:
                self.ticket_rooms[ticket_id].discard(ws)

        # Admins
        admins = list(self.admin_sockets)
        for ws in admins:
            if ws not in room:
                try:
                    await ws.send_text(raw)
                except Exception:
                    self.admin_sockets.discard(ws)

        # User
        if recipient_user_id and recipient_user_id in self.user_sockets:
            user_conns = list(self.user_sockets[recipient_user_id])
            for ws in user_conns:
                if ws not in room:
                    try:
                        await ws.send_text(raw)
                    except Exception:
                        self.user_sockets[recipient_user_id].discard(ws)


ws_manager = ConnectionManager()


async def _resolve_user_from_token(token: str | None) -> tuple[str | None, bool]:
    if not token:
        return None, False
    try:
        settings = get_settings()
        user_id = decode_access_token(token, settings)
        async with async_session_factory() as session:
            user = await session.get(User, user_id)
            if user:
                return user.id, (user.role == "admin")
    except Exception:
        pass
    return None, False


@router.websocket("/ws/support")
async def websocket_support_global(
    websocket: WebSocket,
    token: str | None = Query(default=None),
) -> None:
    user_id, is_admin = await _resolve_user_from_token(token)
    await ws_manager.connect_global(websocket, user_id, is_admin)
    try:
        while True:
            text = await websocket.receive_text()
            if text in ("ping", '{"type":"ping"}', '{"type": "ping"}'):
                await websocket.send_text(json.dumps({"type": "pong"}))
    except (WebSocketDisconnect, Exception):
        ws_manager.disconnect_global(websocket, user_id, is_admin)


@router.websocket("/ws/support/{ticket_id}")
async def websocket_support_ticket(
    websocket: WebSocket,
    ticket_id: str,
    token: str | None = Query(default=None),
) -> None:
    user_id, is_admin = await _resolve_user_from_token(token)
    await ws_manager.connect_ticket(websocket, ticket_id, user_id, is_admin)
    try:
        while True:
            text = await websocket.receive_text()
            if text in ("ping", '{"type":"ping"}', '{"type": "ping"}'):
                await websocket.send_text(json.dumps({"type": "pong"}))
    except (WebSocketDisconnect, Exception):
        ws_manager.disconnect_ticket(websocket, ticket_id, user_id, is_admin)
