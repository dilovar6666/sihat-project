"""Add verified Google identity links.

Revision ID: 0003_google_identities
Revises: 0002_identity_and_access
Create Date: 2026-10-22
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003_google_identities"
down_revision: str | None = "0002_identity_and_access"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "google_identities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("subject"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_google_identities_subject", "google_identities", ["subject"], unique=False)
    op.create_index("ix_google_identities_user_id", "google_identities", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("google_identities")
