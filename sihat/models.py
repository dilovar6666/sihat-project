from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from sihat.db import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="ck_users_role"),
        CheckConstraint("age_group IN ('16_17', '18_plus')", name="ck_users_age_group"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(16), default="user", server_default="user")
    age_group: Mapped[str] = mapped_column(String(16))
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
