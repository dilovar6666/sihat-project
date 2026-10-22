"""Add owner-only immutable saved results.

Revision ID: 0008_saved_results
Revises: 0007_expand_attempts
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008_saved_results"
down_revision: str | None = "0007_expand_attempts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "saved_results",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("test_id", sa.String(length=36), nullable=False),
        sa.Column("test_slug", sa.String(length=120), nullable=False),
        sa.Column("test_type", sa.String(length=32), nullable=False),
        sa.Column("test_title", sa.String(length=240), nullable=False),
        sa.Column("methodology_name", sa.String(length=240), nullable=False),
        sa.Column("methodology_version", sa.String(length=80), nullable=False),
        sa.Column("definition_version", sa.String(length=80), nullable=False),
        sa.Column("compatibility_conditions", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("limitations", sa.Text(), nullable=False),
        sa.Column("warnings", sa.JSON(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["test_id"], ["tests.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saved_results_user_id", "saved_results", ["user_id"], unique=False)
    op.create_index("ix_saved_results_test_id", "saved_results", ["test_id"], unique=False)
    op.create_index("ix_saved_results_test_slug", "saved_results", ["test_slug"], unique=False)
    op.create_index(
        "ix_saved_results_completed_at", "saved_results", ["completed_at"], unique=False
    )


def downgrade() -> None:
    op.drop_table("saved_results")
