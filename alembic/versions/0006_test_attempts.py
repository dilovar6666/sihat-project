"""Add temporary authenticated test attempts.

Revision ID: 0006_test_attempts
Revises: 0005_questionnaires
Create Date: 2026-10-22
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006_test_attempts"
down_revision: str | None = "0005_questionnaires"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "test_attempts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("test_id", sa.String(length=36), nullable=False),
        sa.Column("definition_version", sa.String(length=80), nullable=False),
        sa.Column("definition_snapshot", sa.JSON(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("current_question_id", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=16), server_default="in_progress", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('in_progress', 'completed')", name="ck_test_attempts_status"
        ),
        sa.ForeignKeyConstraint(["test_id"], ["tests.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_test_attempts_user_id", "test_attempts", ["user_id"], unique=False)
    op.create_index("ix_test_attempts_test_id", "test_attempts", ["test_id"], unique=False)
    op.create_index("ix_test_attempts_expires_at", "test_attempts", ["expires_at"], unique=False)


def downgrade() -> None:
    op.drop_table("test_attempts")
