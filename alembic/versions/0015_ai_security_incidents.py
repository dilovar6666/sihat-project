"""AI security incidents for detecting and reviewing suspicious user prompts.

Revision ID: 0015_ai_security_incidents
Revises: 0014_support_chat_system
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0015_ai_security_incidents"
down_revision: str | None = "0014_support_chat_system"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "ai_security_incidents" not in tables:
        op.create_table(
            "ai_security_incidents",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column(
                "user_id",
                sa.String(length=36),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("user_email", sa.String(length=320), nullable=False, index=True),
            sa.Column("user_name", sa.String(length=120), nullable=True),
            sa.Column("suspicious_count", sa.Integer(), server_default="1", nullable=False),
            sa.Column("severity", sa.String(length=16), server_default="high", nullable=False),
            sa.Column("status", sa.String(length=24), server_default="pending_review", nullable=False, index=True),
            sa.Column("last_category", sa.String(length=64), nullable=True),
            sa.Column("queries_log", sa.JSON(), nullable=False),
            sa.Column("admin_notes", sa.Text(), nullable=True),
            sa.Column("reviewed_by", sa.String(length=36), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )
        op.create_index("ix_ai_security_incidents_user_id", "ai_security_incidents", ["user_id"])
        op.create_index("ix_ai_security_incidents_status", "ai_security_incidents", ["status"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if "ai_security_incidents" in tables:
        op.drop_table("ai_security_incidents")
