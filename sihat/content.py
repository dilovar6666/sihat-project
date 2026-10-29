"""Public educational content: FAQ, knowledge base, and support ticket submission."""

from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sihat.auth import get_current_user_optional
from sihat.content_schemas import (
    FaqItemOutput,
    KnowledgeArticleOutput,
    SupportTicketCreateInput,
    SupportTicketOutput,
)
from sihat.db import get_db_session
from sihat.models import FaqItem, KnowledgeArticle, SupportTicket, User

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


def _ticket_output(item: SupportTicket) -> SupportTicketOutput:
    return SupportTicketOutput(
        id=item.id,
        user_id=item.user_id,
        contact_email=item.contact_email,
        subject=item.subject,
        message=item.message,
        status=item.status,
        admin_notes=item.admin_notes,
        created_at=item.created_at.isoformat(),
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
    "/support/tickets", response_model=SupportTicketOutput, status_code=status.HTTP_201_CREATED
)
async def create_support_ticket(
    payload: SupportTicketCreateInput,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    user: User | None = Depends(get_current_user_optional),
) -> SupportTicketOutput:
    client_ip = request.client.host if request.client else "unknown"
    _enforce_support_rate_limit(f"{user.id if user else client_ip}")
    ticket = SupportTicket(
        user_id=user.id if user else None,
        contact_email=payload.contact_email,
        subject=payload.subject.strip(),
        message=payload.message.strip(),
        status="open",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return _ticket_output(ticket)


@router.get("/support/my-tickets", response_model=list[SupportTicketOutput])
async def list_my_support_tickets(
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user_optional),
) -> list[SupportTicketOutput]:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    tickets = (
        await db.scalars(
            select(SupportTicket)
            .where(SupportTicket.user_id == user.id)
            .order_by(SupportTicket.created_at.desc())
        )
    ).all()
    return [_ticket_output(ticket) for ticket in tickets]
