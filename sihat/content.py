"""Public educational content: FAQ, knowledge base, and support ticket submission."""

from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from sihat.auth import get_current_user_optional
from sihat.content_schemas import (
    FaqItemOutput,
    KnowledgeArticleOutput,
    SupportMessageCreateInput,
    SupportMessageOutput,
    SupportTicketBlockInput,
    SupportTicketCreateInput,
    SupportTicketDetailOutput,
    SupportTicketOutput,
    SupportUnreadCountOutput,
)
from sihat.db import get_db_session
from sihat.ws import ws_manager
from sihat.support_ai import process_user_support_message_ai
from sihat.models import FaqItem, KnowledgeArticle, SupportMessage, SupportTicket, User

router = APIRouter(tags=["content"])

_support_timestamps: dict[str, deque[float]] = defaultdict(deque)
_SUPPORT_RATE_LIMIT = 5
_SUPPORT_WINDOW = 300.0  # 5 tickets per 5 minutes per IP


def clear_support_rate_limits() -> None:
    _support_timestamps.clear()


def _enforce_support_rate_limit(key: str) -> None:
    now = monotonic()
    timestamps = _support_timestamps[key]
    while timestamps and timestamps[0] <= now - _SUPPORT_WINDOW:
        timestamps.popleft()
    if len(timestamps) >= _SUPPORT_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many support requests submitted; please wait before sending another",
        )
    timestamps.append(now)


def _faq_output(item: FaqItem) -> FaqItemOutput:
    return FaqItemOutput(
        id=item.id,
        slug=item.slug,
        category=item.category,
        question=item.question,
        answer=item.answer,
        sort_order=item.sort_order,
        is_published=item.is_published,
        created_at=item.created_at.isoformat(),
    )


def _article_output(item: KnowledgeArticle) -> KnowledgeArticleOutput:
    return KnowledgeArticleOutput(
        id=item.id,
        slug=item.slug,
        category=item.category,
        sort_order=item.sort_order,
        is_published=item.is_published,
        localizations=item.localizations,
        created_at=item.created_at.isoformat(),
    )


def _message_output(item: SupportMessage) -> SupportMessageOutput:
    return SupportMessageOutput(
        id=item.id,
        ticket_id=item.ticket_id,
        sender_type=item.sender_type,
        sender_id=item.sender_id,
        sender_name=item.sender_name,
        message=item.message,
        created_at=item.created_at.isoformat(),
        read_by_user=item.read_by_user,
        read_by_admin=item.read_by_admin,
    )


def _ticket_output(
    item: SupportTicket,
    last_message: str | None = None,
    last_message_at: str | None = None,
    unread_user_count: int = 0,
    unread_admin_count: int = 0,
) -> SupportTicketOutput:
    return SupportTicketOutput(
        id=item.id,
        user_id=item.user_id,
        contact_email=item.contact_email,
        subject=item.subject,
        message=item.message,
        status=item.status,
        is_blocked=item.is_blocked,
        admin_notes=item.admin_notes,
        created_at=item.created_at.isoformat(),
        updated_at=item.updated_at.isoformat() if item.updated_at else item.created_at.isoformat(),
        last_message=last_message or item.message,
        last_message_at=last_message_at or item.created_at.isoformat(),
        unread_user_count=unread_user_count,
        unread_admin_count=unread_admin_count,
    )


def _ticket_detail_output(
    item: SupportTicket,
    messages: list[SupportMessage],
    unread_user_count: int = 0,
    unread_admin_count: int = 0,
) -> SupportTicketDetailOutput:
    msgs = [_message_output(m) for m in messages]
    last_msg = msgs[-1].message if msgs else item.message
    last_msg_at = msgs[-1].created_at if msgs else item.created_at.isoformat()
    return SupportTicketDetailOutput(
        id=item.id,
        user_id=item.user_id,
        contact_email=item.contact_email,
        subject=item.subject,
        message=item.message,
        status=item.status,
        is_blocked=item.is_blocked,
        admin_notes=item.admin_notes,
        created_at=item.created_at.isoformat(),
        updated_at=item.updated_at.isoformat() if item.updated_at else item.created_at.isoformat(),
        last_message=last_msg,
        last_message_at=last_msg_at,
        unread_user_count=unread_user_count,
        unread_admin_count=unread_admin_count,
        messages=msgs,
    )


@router.get("/faq", response_model=list[FaqItemOutput])
async def list_published_faq(db: AsyncSession = Depends(get_db_session)) -> list[FaqItemOutput]:
    items = (
        await db.scalars(
            select(FaqItem)
            .where(FaqItem.is_published.is_(True))
            .order_by(FaqItem.sort_order, FaqItem.slug)
        )
    ).all()
    return [_faq_output(item) for item in items]


@router.get("/knowledge", response_model=list[KnowledgeArticleOutput])
async def list_published_articles(
    category: str | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> list[KnowledgeArticleOutput]:
    statement = select(KnowledgeArticle).where(KnowledgeArticle.is_published.is_(True))
    if category:
        statement = statement.where(KnowledgeArticle.category == category)
    items = (
        await db.scalars(statement.order_by(KnowledgeArticle.sort_order, KnowledgeArticle.slug))
    ).all()
    return [_article_output(item) for item in items]


@router.get("/knowledge/{slug}", response_model=KnowledgeArticleOutput)
async def get_published_article(
    slug: str, db: AsyncSession = Depends(get_db_session)
) -> KnowledgeArticleOutput:
    item = await db.scalar(
        select(KnowledgeArticle).where(
            KnowledgeArticle.slug == slug, KnowledgeArticle.is_published.is_(True)
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge article not found")
    return _article_output(item)


@router.post(
    "/support/tickets", response_model=SupportTicketDetailOutput, status_code=status.HTTP_201_CREATED
)
async def create_support_ticket(
    payload: SupportTicketCreateInput,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    user: User | None = Depends(get_current_user_optional),
) -> SupportTicketDetailOutput:
    client_ip = request.client.host if request.client else "unknown"
    _enforce_support_rate_limit(f"{user.id if user else client_ip}")
    ticket = SupportTicket(
        user_id=user.id if user else None,
        contact_email=payload.contact_email,
        subject=payload.subject.strip(),
        message=payload.message.strip(),
        status="open",
        is_blocked=False,
    )
    db.add(ticket)
    await db.flush()

    # Create initial message in thread
    initial_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="user",
        sender_id=user.id if user else None,
        sender_name=user.full_name if user else payload.contact_email,
        message=payload.message.strip(),
        read_by_user=True,
        read_by_admin=False,
    )
    db.add(initial_msg)
    await db.commit()
    await db.refresh(ticket)
    await db.refresh(initial_msg)

    # 1. Real-time WebSocket broadcast of user initial message
    initial_msg_dict = {
        "id": initial_msg.id,
        "ticket_id": initial_msg.ticket_id,
        "sender_type": initial_msg.sender_type,
        "sender_id": initial_msg.sender_id,
        "sender_name": initial_msg.sender_name,
        "message": initial_msg.message,
        "created_at": initial_msg.created_at.isoformat(),
        "read_by_user": initial_msg.read_by_user,
        "read_by_admin": initial_msg.read_by_admin,
    }
    ticket_dict = {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "contact_email": ticket.contact_email,
        "subject": ticket.subject,
        "status": ticket.status,
        "is_blocked": ticket.is_blocked,
        "admin_notes": ticket.admin_notes,
        "last_message": initial_msg.message,
        "last_message_at": initial_msg.created_at.isoformat(),
        "unread_user_count": 0,
        "unread_admin_count": 1,
    }
    await ws_manager.broadcast_new_message(
        ticket_id=ticket.id,
        message=initial_msg_dict,
        ticket=ticket_dict,
        recipient_user_id=ticket.user_id,
    )

    # 2. Trigger AI Support First-Responder
    ai_msg = await process_user_support_message_ai(db, ticket, initial_msg.message, user)
    all_msgs = [initial_msg]
    if ai_msg:
        all_msgs.append(ai_msg)

    return _ticket_detail_output(ticket, all_msgs, unread_user_count=0, unread_admin_count=1)


@router.get("/support/my-tickets", response_model=list[SupportTicketOutput])
async def list_my_support_tickets(
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user_optional),
) -> list[SupportTicketOutput]:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    conditions = [SupportTicket.user_id == user.id]
    if user.email:
        conditions.append(SupportTicket.contact_email == user.email)

    tickets = (
        await db.scalars(
            select(SupportTicket)
            .where(or_(*conditions))
            .order_by(SupportTicket.updated_at.desc())
        )
    ).all()

    output = []
    for ticket in tickets:
        messages = (
            await db.scalars(
                select(SupportMessage)
                .where(SupportMessage.ticket_id == ticket.id)
                .order_by(SupportMessage.created_at.asc())
            )
        ).all()
        last_msg = messages[-1].message if messages else ticket.message
        last_msg_at = messages[-1].created_at.isoformat() if messages else ticket.created_at.isoformat()
        unread_user = sum(1 for m in messages if m.sender_type == "admin" and not m.read_by_user)
        unread_admin = sum(1 for m in messages if m.sender_type == "user" and not m.read_by_admin)
        output.append(
            _ticket_output(
                ticket,
                last_message=last_msg,
                last_message_at=last_msg_at,
                unread_user_count=unread_user,
                unread_admin_count=unread_admin,
            )
        )
    return output


@router.get("/support/tickets/{ticket_id}", response_model=SupportTicketDetailOutput)
async def get_support_ticket_detail(
    ticket_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user_optional),
) -> SupportTicketDetailOutput:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    is_owner = (ticket.user_id == user.id) or (user.email and ticket.contact_email == user.email)
    if not is_owner and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    messages = (
        await db.scalars(
            select(SupportMessage)
            .where(SupportMessage.ticket_id == ticket_id)
            .order_by(SupportMessage.created_at.asc())
        )
    ).all()

    # Mark all admin messages as read by this user
    changed = False
    for msg in messages:
        if msg.sender_type == "admin" and not msg.read_by_user:
            msg.read_by_user = True
            changed = True
    if changed:
        await db.commit()

    unread_admin = sum(1 for m in messages if m.sender_type == "user" and not m.read_by_admin)
    return _ticket_detail_output(ticket, list(messages), unread_user_count=0, unread_admin_count=unread_admin)


@router.post("/support/tickets/{ticket_id}/messages", response_model=SupportMessageOutput)
async def send_support_ticket_message(
    ticket_id: str,
    payload: SupportMessageCreateInput,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user_optional),
) -> SupportMessageOutput:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    is_owner = (ticket.user_id == user.id) or (user.email and ticket.contact_email == user.email)
    if not is_owner and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if ticket.is_blocked:
        raise HTTPException(
            status_code=400,
            detail="Этот диалог заблокирован или закрыт. Разблокируйте его для продолжения общения.",
        )

    sender_type = "admin" if (user.role == "admin" and not is_owner) else "user"
    sender_name = "Поддержка SIHAT" if sender_type == "admin" else (user.full_name or user.email)

    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type=sender_type,
        sender_id=user.id,
        sender_name=sender_name,
        message=payload.message.strip(),
        read_by_user=(sender_type == "user"),
        read_by_admin=(sender_type == "admin"),
    )
    db.add(msg)

    # Update ticket status
    if sender_type == "user":
        ticket.status = "open"
    else:
        ticket.status = "in_progress"

    await db.commit()
    await db.refresh(msg)
    await db.refresh(ticket)

    msg_dict = {
        "id": msg.id,
        "ticket_id": msg.ticket_id,
        "sender_type": msg.sender_type,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "message": msg.message,
        "created_at": msg.created_at.isoformat(),
        "read_by_user": msg.read_by_user,
        "read_by_admin": msg.read_by_admin,
    }
    ticket_dict = {
        "id": ticket.id,
        "status": ticket.status,
        "is_blocked": ticket.is_blocked,
        "admin_notes": ticket.admin_notes,
        "last_message": msg.message,
        "last_message_at": msg.created_at.isoformat(),
        "unread_user_count": 0 if sender_type == "user" else 1,
        "unread_admin_count": 1 if sender_type == "user" else 0,
    }
    await ws_manager.broadcast_new_message(
        ticket_id=ticket.id,
        message=msg_dict,
        ticket=ticket_dict,
        recipient_user_id=ticket.user_id,
    )

    # If sender is user, trigger AI First-Responder
    if sender_type == "user":
        await process_user_support_message_ai(db, ticket, msg.message, user)

    return _message_output(msg)


@router.patch("/support/tickets/{ticket_id}/block", response_model=SupportTicketOutput)
async def toggle_block_support_ticket(
    ticket_id: str,
    payload: SupportTicketBlockInput,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user_optional),
) -> SupportTicketOutput:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    is_owner = (ticket.user_id == user.id) or (user.email and ticket.contact_email == user.email)
    if not is_owner and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    ticket.is_blocked = payload.is_blocked
    if payload.is_blocked:
        ticket.status = "closed"
    elif ticket.status == "closed":
        ticket.status = "open"

    await db.commit()
    await db.refresh(ticket)
    return _ticket_output(ticket)


@router.delete("/support/tickets/{ticket_id}")
async def delete_support_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user_optional),
) -> dict[str, str]:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    ticket = await db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    is_owner = (ticket.user_id == user.id) or (user.email and ticket.contact_email == user.email)
    if not is_owner and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(ticket)
    await db.commit()
    return {"status": "deleted", "id": ticket_id}


@router.get("/support/unread-count", response_model=SupportUnreadCountOutput)
async def get_support_unread_count(
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user_optional),
) -> SupportUnreadCountOutput:
    if not user:
        return SupportUnreadCountOutput(unread_count=0)

    conditions = [SupportTicket.user_id == user.id]
    if user.email:
        conditions.append(SupportTicket.contact_email == user.email)

    user_ticket_ids = (
        await db.scalars(
            select(SupportTicket.id).where(or_(*conditions))
        )
    ).all()

    if not user_ticket_ids:
        return SupportUnreadCountOutput(unread_count=0)

    count = (
        await db.scalar(
            select(func.count(SupportMessage.id)).where(
                SupportMessage.ticket_id.in_(user_ticket_ids),
                SupportMessage.sender_type == "admin",
                SupportMessage.read_by_user.is_(False),
            )
        )
    ) or 0

    return SupportUnreadCountOutput(unread_count=count)
