"""Protected administrative operations: dashboard analytics, user accounts,
catalog controls, content authoring, and support management."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from sihat.admin_schemas import (
    AdminCategoryOutput,
    AdminCategoryUpdateInput,
    AdminDashboardOutput,
    AdminTestUpdateInput,
    AdminUserOutput,
    AdminUserUpdateInput,
    ContentDraftInput,
    ContentDraftOutput,
)
from sihat.catalog import _test_output, _validate_localizations, require_admin
from sihat.config import Settings, get_settings
from sihat.content_schemas import (
    FaqItemInput,
    FaqItemOutput,
    FaqItemUpdateInput,
    KnowledgeArticleInput,
    KnowledgeArticleOutput,
    KnowledgeArticleUpdateInput,
    SupportTicketOutput,
    SupportTicketUpdateInput,
)
from sihat.db import get_db_session
from sihat.gemini import GeminiUnavailableError, generate_assistant_response
from sihat.models import (
    Category,
    FaqItem,
    KnowledgeArticle,
    MethodologyPassport,
    SavedResult,
    SupportTicket,
    TestAttempt,
    TestDefinition,
    User,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _admin_user_output(u: User) -> AdminUserOutput:
    return AdminUserOutput(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        age_group=u.age_group,
        is_active=u.is_active,
        created_at=u.created_at.isoformat(),
    )


def _admin_faq_output(item: FaqItem) -> FaqItemOutput:
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


def _admin_article_output(item: KnowledgeArticle) -> KnowledgeArticleOutput:
    return KnowledgeArticleOutput(
        id=item.id,
        slug=item.slug,
        category=item.category,
        sort_order=item.sort_order,
        is_published=item.is_published,
        localizations=item.localizations,
        created_at=item.created_at.isoformat(),
    )


def _admin_ticket_output(item: SupportTicket) -> SupportTicketOutput:
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


# ---------------------------------------------------------------------------
# Dashboard: Aggregate-only analytics (strictly zero individual medical data)
# ---------------------------------------------------------------------------


@router.get("/dashboard", response_model=AdminDashboardOutput)
def dashboard_analytics(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> AdminDashboardOutput:
    total_users = db.scalar(select(func.count(User.id))) or 0
    active_users = db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
    inactive_users = total_users - active_users

    age_rows = db.execute(
        select(User.age_group, func.count(User.id)).group_by(User.age_group)
    ).all()
    users_by_age = {str(row[0]): int(row[1]) for row in age_rows}

    total_categories = db.scalar(select(func.count(Category.id))) or 0

    status_rows = db.execute(
        select(TestDefinition.availability_status, func.count(TestDefinition.id)).group_by(
            TestDefinition.availability_status
        )
    ).all()
    tests_by_status = {str(row[0]): int(row[1]) for row in status_rows}

    type_rows = db.execute(
        select(TestDefinition.test_type, func.count(TestDefinition.id)).group_by(
            TestDefinition.test_type
        )
    ).all()
    tests_by_type = {str(row[0]): int(row[1]) for row in type_rows}

    total_completed = (
        db.scalar(select(func.count(TestAttempt.id)).where(TestAttempt.status == "completed")) or 0
    )
    total_saved = db.scalar(select(func.count(SavedResult.id))) or 0

    ticket_rows = db.execute(
        select(SupportTicket.status, func.count(SupportTicket.id)).group_by(SupportTicket.status)
    ).all()
    tickets_by_status = {str(row[0]): int(row[1]) for row in ticket_rows}

    return AdminDashboardOutput(
        total_users=total_users,
        users_by_age_group=users_by_age,
        active_users=active_users,
        inactive_users=inactive_users,
        total_categories=total_categories,
        tests_by_status=tests_by_status,
        tests_by_type=tests_by_type,
        total_completed_attempts=total_completed,
        total_saved_results=total_saved,
        tickets_by_status=tickets_by_status,
    )


# ---------------------------------------------------------------------------
# User management (Technical account management only; no test answers)
# ---------------------------------------------------------------------------


@router.get("/users", response_model=list[AdminUserOutput])
def list_users(
    role: str | None = None,
    age_group: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> list[AdminUserOutput]:
    stmt = select(User).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if age_group:
        stmt = stmt.where(User.age_group == age_group)
    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(func.lower(User.email).like(term), func.lower(User.full_name).like(term))
        )
    users = db.scalars(stmt).all()
    return [_admin_user_output(u) for u in users]


@router.patch("/users/{user_id}", response_model=AdminUserOutput)
def update_user_status(
    user_id: str,
    payload: AdminUserUpdateInput,
    db: Session = Depends(get_db_session),
    current_admin: User = Depends(require_admin),
) -> AdminUserOutput:
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Protection against admin self-lockout
    if target_user.id == current_admin.id:
        if payload.role == "user":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot demote their own account",
            )
        if payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot deactivate their own account",
            )

    if payload.role is not None:
        target_user.role = payload.role
    if payload.is_active is not None:
        target_user.is_active = payload.is_active

    db.commit()
    db.refresh(target_user)
    return _admin_user_output(target_user)


# ---------------------------------------------------------------------------
# Categories management
# ---------------------------------------------------------------------------


@router.get("/categories", response_model=list[AdminCategoryOutput])
def list_all_categories(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> list[AdminCategoryOutput]:
    categories = db.scalars(select(Category).order_by(Category.sort_order, Category.slug)).all()
    counts = dict(
        db.execute(
            select(TestDefinition.category_id, func.count(TestDefinition.id)).group_by(
                TestDefinition.category_id
            )
        ).all()
    )
    return [
        AdminCategoryOutput(
            id=c.id,
            slug=c.slug,
            localizations=c.localizations,
            sort_order=c.sort_order,
            is_active=c.is_active,
            tests_count=counts.get(c.id, 0),
        )
        for c in categories
    ]


@router.patch("/categories/{category_id}", response_model=AdminCategoryOutput)
def update_category(
    category_id: str,
    payload: AdminCategoryUpdateInput,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> AdminCategoryOutput:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if payload.localizations is not None:
        _validate_localizations(payload.localizations)
        category.localizations = payload.localizations
    if payload.sort_order is not None:
        category.sort_order = payload.sort_order
    if payload.is_active is not None:
        category.is_active = payload.is_active

    db.commit()
    db.refresh(category)
    tests_count = (
        db.scalar(
            select(func.count(TestDefinition.id)).where(TestDefinition.category_id == category.id)
        )
        or 0
    )
    return AdminCategoryOutput(
        id=category.id,
        slug=category.slug,
        localizations=category.localizations,
        sort_order=category.sort_order,
        is_active=category.is_active,
        tests_count=tests_count,
    )


# ---------------------------------------------------------------------------
# Test Catalog controls (Status, unpublish, block)
# ---------------------------------------------------------------------------


@router.get("/tests")
def list_all_admin_tests(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> list[dict]:
    stmt = select(TestDefinition)
    if status_filter:
        stmt = stmt.where(TestDefinition.availability_status == status_filter)
    tests = db.scalars(stmt.order_by(TestDefinition.slug)).all()
    passports = {p.test_id: p for p in db.scalars(select(MethodologyPassport)).all()}
    return [_test_output(t, passports.get(t.id)) for t in tests]


@router.patch("/tests/{test_id}")
def update_test_settings(
    test_id: str,
    payload: AdminTestUpdateInput,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    test = db.get(TestDefinition, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if payload.localizations is not None:
        _validate_localizations(payload.localizations)
        test.localizations = payload.localizations
    if payload.guest_allowed is not None:
        test.guest_allowed = payload.guest_allowed
    if payload.min_age is not None:
        test.min_age = payload.min_age
    if payload.max_age is not None:
        if payload.max_age < test.min_age:
            raise HTTPException(status_code=422, detail="max_age cannot be lower than min_age")
        test.max_age = payload.max_age
    if payload.test_type is not None:
        test.test_type = payload.test_type
    if payload.test_engine_key is not None:
        test.test_engine_key = payload.test_engine_key

    db.commit()
    db.refresh(test)
    passport = db.scalar(select(MethodologyPassport).where(MethodologyPassport.test_id == test.id))
    return _test_output(test, passport)


@router.post("/tests/{test_id}/block")
def block_test(
    test_id: str,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    test = db.get(TestDefinition, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    test.availability_status = "blocked"
    db.commit()
    passport = db.scalar(select(MethodologyPassport).where(MethodologyPassport.test_id == test.id))
    return _test_output(test, passport)


@router.post("/tests/{test_id}/unpublish")
def unpublish_test(
    test_id: str,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    test = db.get(TestDefinition, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    test.availability_status = "draft"
    db.commit()
    passport = db.scalar(select(MethodologyPassport).where(MethodologyPassport.test_id == test.id))
    return _test_output(test, passport)


# ---------------------------------------------------------------------------
# FAQ Management
# ---------------------------------------------------------------------------


@router.get("/faq", response_model=list[FaqItemOutput])
def list_admin_faq(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> list[FaqItemOutput]:
    items = db.scalars(select(FaqItem).order_by(FaqItem.sort_order, FaqItem.slug)).all()
    return [_admin_faq_output(item) for item in items]


@router.post("/faq", response_model=FaqItemOutput, status_code=status.HTTP_201_CREATED)
def create_faq(
    payload: FaqItemInput,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> FaqItemOutput:
    if db.scalar(select(FaqItem.id).where(FaqItem.slug == payload.slug)):
        raise HTTPException(status_code=409, detail="FAQ slug already exists")
    item = FaqItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _admin_faq_output(item)


@router.patch("/faq/{faq_id}", response_model=FaqItemOutput)
def update_faq(
    faq_id: str,
    payload: FaqItemUpdateInput,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> FaqItemOutput:
    item = db.get(FaqItem, faq_id)
    if not item:
        raise HTTPException(status_code=404, detail="FAQ item not found")

    for key, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(item, key, val)

    db.commit()
    db.refresh(item)
    return _admin_faq_output(item)


@router.delete("/faq/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(
    faq_id: str,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> None:
    item = db.get(FaqItem, faq_id)
    if not item:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    db.delete(item)
    db.commit()


# ---------------------------------------------------------------------------
# Knowledge Articles Management
# ---------------------------------------------------------------------------


@router.get("/knowledge", response_model=list[KnowledgeArticleOutput])
def list_admin_articles(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> list[KnowledgeArticleOutput]:
    items = db.scalars(
        select(KnowledgeArticle).order_by(KnowledgeArticle.sort_order, KnowledgeArticle.slug)
    ).all()
    return [_admin_article_output(item) for item in items]


@router.post(
    "/knowledge", response_model=KnowledgeArticleOutput, status_code=status.HTTP_201_CREATED
)
def create_article(
    payload: KnowledgeArticleInput,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> KnowledgeArticleOutput:
    if db.scalar(select(KnowledgeArticle.id).where(KnowledgeArticle.slug == payload.slug)):
        raise HTTPException(status_code=409, detail="Article slug already exists")
    item = KnowledgeArticle(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _admin_article_output(item)


@router.patch("/knowledge/{article_id}", response_model=KnowledgeArticleOutput)
def update_article(
    article_id: str,
    payload: KnowledgeArticleUpdateInput,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> KnowledgeArticleOutput:
    item = db.get(KnowledgeArticle, article_id)
    if not item:
        raise HTTPException(status_code=404, detail="Article not found")

    for key, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(item, key, val)

    db.commit()
    db.refresh(item)
    return _admin_article_output(item)


@router.delete("/knowledge/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: str,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> None:
    item = db.get(KnowledgeArticle, article_id)
    if not item:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(item)
    db.commit()


# ---------------------------------------------------------------------------
# Support Tickets Management
# ---------------------------------------------------------------------------


@router.get("/support/tickets", response_model=list[SupportTicketOutput])
def list_support_tickets(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> list[SupportTicketOutput]:
    stmt = select(SupportTicket).order_by(SupportTicket.created_at.desc())
    if status_filter:
        stmt = stmt.where(SupportTicket.status == status_filter)
    tickets = db.scalars(stmt).all()
    return [_admin_ticket_output(t) for t in tickets]


@router.patch("/support/tickets/{ticket_id}", response_model=SupportTicketOutput)
def update_support_ticket(
    ticket_id: str,
    payload: SupportTicketUpdateInput,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> SupportTicketOutput:
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    if payload.status is not None:
        ticket.status = payload.status
    if payload.admin_notes is not None:
        ticket.admin_notes = payload.admin_notes

    db.commit()
    db.refresh(ticket)
    return _admin_ticket_output(ticket)


# ---------------------------------------------------------------------------
# AI Content Drafting (Safe drafting only; never auto-published or validated)
# ---------------------------------------------------------------------------


@router.post("/content/draft", response_model=ContentDraftOutput)
def draft_content(
    payload: ContentDraftInput,
    settings: Settings = Depends(get_settings),
    _: User = Depends(require_admin),
) -> ContentDraftOutput:
    prompt = (
        f"Draft a non-diagnostic educational {payload.content_type} item in language "
        f"'{payload.language}' for the SIHAT platform on the topic: '{payload.topic}'. "
        "Strict rules: Never diagnose, never prescribe treatment, never make clinical claims, "
        "and emphasize that SIHAT provides educational exercises, not medical examinations."
    )
    if settings.gemini_is_configured:
        try:
            res = generate_assistant_response(
                settings=settings,
                conversation=[{"role": "user", "text": prompt}],
                shared_results=[],
            )
            message = res.get("message", "")
            return ContentDraftOutput(
                title=f"Draft: {payload.topic}",
                content=message,
                note=(
                    "AI draft for administrative review. Must be verified for factual integrity "
                    "before publication."
                ),
            )
        except GeminiUnavailableError:
            pass

    # Clean fallback draft template
    return ContentDraftOutput(
        title=f"Draft: {payload.topic}",
        content=(
            f"Educational material concerning '{payload.topic}'. SIHAT exercises offer digital "
            "orientation only, not a clinical diagnosis or treatment prescription. "
            "For medical concerns, consult a licensed healthcare professional."
        ),
        note="Template draft for administrative review. Verify sources before publication.",
    )
