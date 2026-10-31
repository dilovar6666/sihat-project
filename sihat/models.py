from typing import Any
from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from sihat.db import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="ck_users_role"),
        CheckConstraint("age_group IN ('16_17', '18_plus')", name="ck_users_age_group"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True, nullable=True, default=None)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True, index=True, nullable=True, default=None)
    full_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(16), default="user", server_default="user")
    age_group: Mapped[str] = mapped_column(String(16))
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    refresh_token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GoogleIdentity(Base):
    __tablename__ = "google_identities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(320))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    localizations: Mapped[dict] = mapped_column(JSON, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TestDefinition(Base):
    __tablename__ = "tests"
    __table_args__ = (
        CheckConstraint(
            "test_type IN ("
            "'validated_screening', "
            "'digital_check', "
            "'educational_exercise', "
            "'symptom_questionnaire'"
            ")",
            name="ck_tests_type",
        ),
        CheckConstraint(
            "availability_status IN ('draft', 'published', 'blocked')",
            name="ck_tests_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    category_id: Mapped[str] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), index=True
    )
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    test_type: Mapped[str] = mapped_column(String(32))
    availability_status: Mapped[str] = mapped_column(
        String(16), default="draft", server_default="draft"
    )
    guest_allowed: Mapped[bool] = mapped_column(default=False, server_default="false")
    min_age: Mapped[int] = mapped_column(Integer, default=16, server_default="16")
    max_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    localizations: Mapped[dict] = mapped_column(JSON, default=dict)
    test_engine_key: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MethodologyPassport(Base):
    __tablename__ = "methodology_passports"
    __table_args__ = (
        CheckConstraint(
            "evidence_status IN ('validated', 'digital', 'educational', 'pending_review')",
            name="ck_methodology_evidence_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    test_id: Mapped[str] = mapped_column(
        ForeignKey("tests.id", ondelete="CASCADE"), unique=True, index=True
    )
    methodology_name: Mapped[str] = mapped_column(String(240))
    methodology_version: Mapped[str] = mapped_column(String(80))
    evidence_status: Mapped[str] = mapped_column(String(24), default="pending_review")
    evidence_source: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    license_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    allowed_languages: Mapped[list] = mapped_column(JSON, default=list)
    device_conditions: Mapped[list] = mapped_column(JSON, default=list)
    scoring_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    interpretation_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    limitations: Mapped[str] = mapped_column(Text)
    warnings: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    test_id: Mapped[str] = mapped_column(
        ForeignKey("tests.id", ondelete="CASCADE"), unique=True, index=True
    )
    definition_version: Mapped[str] = mapped_column(String(80))
    questions: Mapped[list] = mapped_column(JSON, default=list)
    branching_rules: Mapped[list] = mapped_column(JSON, default=list)
    scoring_config: Mapped[dict] = mapped_column(JSON, default=dict)
    is_published: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TestAttempt(Base):
    __tablename__ = "test_attempts"
    __table_args__ = (
        CheckConstraint("status IN ('in_progress', 'completed')", name="ck_test_attempts_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    test_id: Mapped[str] = mapped_column(ForeignKey("tests.id", ondelete="RESTRICT"), index=True)
    definition_version: Mapped[str] = mapped_column(String(80))
    definition_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    questionnaire_version: Mapped[str] = mapped_column(String(80))
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    current_question_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), default="in_progress", server_default="in_progress"
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    save_consent: Mapped[bool | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SavedResult(Base):
    """An owner-only, immutable record created after explicit save consent."""

    __tablename__ = "saved_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    test_id: Mapped[str] = mapped_column(ForeignKey("tests.id", ondelete="RESTRICT"), index=True)
    test_slug: Mapped[str] = mapped_column(String(120), index=True)
    test_type: Mapped[str] = mapped_column(String(32))
    test_title: Mapped[str] = mapped_column(String(240))
    methodology_name: Mapped[str] = mapped_column(String(240))
    methodology_version: Mapped[str] = mapped_column(String(80))
    definition_version: Mapped[str] = mapped_column(String(80))
    compatibility_conditions: Mapped[dict] = mapped_column(JSON, default=dict)
    result: Mapped[dict] = mapped_column(JSON)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    limitations: Mapped[str] = mapped_column(Text)
    warnings: Mapped[list] = mapped_column(JSON, default=list)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FaqItem(Base):
    __tablename__ = "faq_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(64), index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_published: Mapped[bool] = mapped_column(default=True, server_default="true")
    question: Mapped[dict] = mapped_column(JSON, default=dict)
    answer: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(64), index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_published: Mapped[bool] = mapped_column(default=True, server_default="true")
    localizations: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    __table_args__ = (
        CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'closed')",
            name="ck_support_tickets_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    contact_email: Mapped[str] = mapped_column(String(320), index=True)
    subject: Mapped[str] = mapped_column(String(240))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(16), default="open", server_default="open", index=True
    )
    is_blocked: Mapped[bool] = mapped_column(default=False, server_default="false")
    is_ai_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    needs_human: Mapped[bool] = mapped_column(default=False, server_default="false", index=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages: Mapped[list["SupportMessage"]] = relationship(
        "SupportMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="SupportMessage.created_at.asc()"
    )


class SupportMessage(Base):
    __tablename__ = "support_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ticket_id: Mapped[str] = mapped_column(
        ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_type: Mapped[str] = mapped_column(
        String(16), nullable=False
    )  # 'user' | 'admin'
    sender_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    sender_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read_by_user: Mapped[bool] = mapped_column(default=False, server_default="false")
    read_by_admin: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ticket: Mapped["SupportTicket"] = relationship("SupportTicket", back_populates="messages")

class AiSecurityIncident(Base):
    __tablename__ = "ai_security_incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    user_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    suspicious_count: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    severity: Mapped[str] = mapped_column(String(16), default="high", server_default="high")
    status: Mapped[str] = mapped_column(
        String(24), default="pending_review", server_default="pending_review", index=True
    )
    last_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    queries_log: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

