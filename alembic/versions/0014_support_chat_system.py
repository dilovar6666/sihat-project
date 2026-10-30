"""Support chat system with threaded messages and user blocking.

Revision ID: 0014_support_chat_system
Revises: 0013_publish_color_perception
"""

from collections.abc import Sequence
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

revision: str = "0014_support_chat_system"
down_revision: str | None = "0013_publish_color_perception"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Add is_blocked to support_tickets if not exists
    columns = [c["name"] for c in inspector.get_columns("support_tickets")]
    if "is_blocked" not in columns:
        op.add_column(
            "support_tickets",
            sa.Column("is_blocked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        )

    # 2. Create support_messages table if not exists
    tables = inspector.get_table_names()
    if "support_messages" not in tables:
        op.create_table(
            "support_messages",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column(
                "ticket_id",
                sa.String(length=36),
                sa.ForeignKey("support_tickets.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("sender_type", sa.String(length=16), nullable=False),
            sa.Column(
                "sender_id",
                sa.String(length=36),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("sender_name", sa.String(length=120), nullable=True),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column(
                "read_by_user",
                sa.Boolean(),
                server_default=sa.text("false"),
                nullable=False,
            ),
            sa.Column(
                "read_by_admin",
                sa.Boolean(),
                server_default=sa.text("false"),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )
        op.create_index("ix_support_messages_ticket_id", "support_messages", ["ticket_id"])
        op.create_index("ix_support_messages_sender_id", "support_messages", ["sender_id"])

    # 3. Migrate existing tickets to have an initial message in support_messages
    try:
        tickets = bind.execute(sa.text("SELECT id, user_id, contact_email, message, created_at FROM support_tickets")).fetchall()
        for t in tickets:
            t_id, u_id, email, msg, created_at = t
            exists = bind.execute(sa.text("SELECT 1 FROM support_messages WHERE ticket_id = :tid LIMIT 1"), {"tid": t_id}).scalar()
            if not exists and msg:
                msg_id = str(uuid4())
                bind.execute(
                    sa.text("""
                        INSERT INTO support_messages (id, ticket_id, sender_type, sender_id, sender_name, message, read_by_user, read_by_admin, created_at)
                        VALUES (:id, :ticket_id, 'user', :sender_id, :sender_name, :message, true, true, :created_at)
                    """),
                    {
                        "id": msg_id,
                        "ticket_id": t_id,
                        "sender_id": u_id,
                        "sender_name": email,
                        "message": msg,
                        "created_at": created_at,
                    }
                )
    except Exception as e:
        print(f"Notice: initial support messages migration note: {e}")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if "support_messages" in tables:
        op.drop_table("support_messages")

    columns = [c["name"] for c in inspector.get_columns("support_tickets")]
    if "is_blocked" in columns:
        op.drop_column("support_tickets", "is_blocked")
