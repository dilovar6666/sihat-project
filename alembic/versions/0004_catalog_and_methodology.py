"""Add catalog and methodology passport tables.

Revision ID: 0004_catalog_and_methodology
Revises: 0003_google_identities
Create Date: 2026-10-22
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004_catalog_and_methodology"
down_revision: str | None = "0003_google_identities"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("localizations", sa.JSON(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=False)
    op.create_table(
        "tests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("category_id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("test_type", sa.String(length=32), nullable=False),
        sa.Column(
            "availability_status", sa.String(length=16), server_default="draft", nullable=False
        ),
        sa.Column("guest_allowed", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("min_age", sa.Integer(), server_default="16", nullable=False),
        sa.Column("max_age", sa.Integer(), nullable=True),
        sa.Column("localizations", sa.JSON(), nullable=False),
        sa.Column("test_engine_key", sa.String(length=80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "test_type IN ('validated_screening', 'digital_check', 'educational_exercise', 'symptom_questionnaire')",
            name="ck_tests_type",
        ),
        sa.CheckConstraint(
            "availability_status IN ('draft', 'published', 'blocked')", name="ck_tests_status"
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_tests_category_id", "tests", ["category_id"], unique=False)
    op.create_index("ix_tests_slug", "tests", ["slug"], unique=False)
    op.create_table(
        "methodology_passports",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("test_id", sa.String(length=36), nullable=False),
        sa.Column("methodology_name", sa.String(length=240), nullable=False),
        sa.Column("methodology_version", sa.String(length=80), nullable=False),
        sa.Column("evidence_status", sa.String(length=24), nullable=False),
        sa.Column("evidence_source", sa.String(length=2048), nullable=True),
        sa.Column("license_info", sa.Text(), nullable=True),
        sa.Column("allowed_languages", sa.JSON(), nullable=False),
        sa.Column("device_conditions", sa.JSON(), nullable=False),
        sa.Column("scoring_summary", sa.Text(), nullable=True),
        sa.Column("interpretation_summary", sa.Text(), nullable=True),
        sa.Column("limitations", sa.Text(), nullable=False),
        sa.Column("warnings", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "evidence_status IN ('validated', 'digital', 'educational', 'pending_review')",
            name="ck_methodology_evidence_status",
        ),
        sa.ForeignKeyConstraint(["test_id"], ["tests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("test_id"),
    )
    op.create_index(
        "ix_methodology_passports_test_id", "methodology_passports", ["test_id"], unique=False
    )


def downgrade() -> None:
    op.drop_table("methodology_passports")
    op.drop_table("tests")
    op.drop_table("categories")
