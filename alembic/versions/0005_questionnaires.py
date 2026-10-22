"""Add versioned questionnaire definitions.

Revision ID: 0005_questionnaires
Revises: 0004_catalog_and_methodology
Create Date: 2026-10-22
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_questionnaires"
down_revision: str | None = "0004_catalog_and_methodology"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "questionnaires",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("test_id", sa.String(length=36), nullable=False),
        sa.Column("definition_version", sa.String(length=80), nullable=False),
        sa.Column("questions", sa.JSON(), nullable=False),
        sa.Column("branching_rules", sa.JSON(), nullable=False),
        sa.Column("scoring_config", sa.JSON(), nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["test_id"], ["tests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("test_id"),
    )
    op.create_index("ix_questionnaires_test_id", "questionnaires", ["test_id"], unique=False)


def downgrade() -> None:
    op.drop_table("questionnaires")
