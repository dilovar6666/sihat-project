"""Add FAQ, knowledge base articles, and support tickets for admin and content.

Revision ID: 0009_admin_and_content
Revises: 0008_saved_results
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0009_admin_and_content"
down_revision: str | None = "0008_saved_results"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "faq_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("question", sa.JSON(), nullable=False),
        sa.Column("answer", sa.JSON(), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_faq_items_slug", "faq_items", ["slug"], unique=True)
    op.create_index("ix_faq_items_category", "faq_items", ["category"], unique=False)

    op.create_table(
        "knowledge_articles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("localizations", sa.JSON(), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_knowledge_articles_slug", "knowledge_articles", ["slug"], unique=True)
    op.create_index(
        "ix_knowledge_articles_category", "knowledge_articles", ["category"], unique=False
    )

    op.create_table(
        "support_tickets",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("contact_email", sa.String(length=320), nullable=False),
        sa.Column("subject", sa.String(length=240), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="open", nullable=False),
        sa.Column("admin_notes", sa.Text(), nullable=True),
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
        sa.CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'closed')",
            name="ck_support_tickets_status",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_support_tickets_user_id", "support_tickets", ["user_id"], unique=False)
    op.create_index(
        "ix_support_tickets_contact_email", "support_tickets", ["contact_email"], unique=False
    )
    op.create_index("ix_support_tickets_status", "support_tickets", ["status"], unique=False)


def downgrade() -> None:
    op.drop_table("support_tickets")
    op.drop_table("knowledge_articles")
    op.drop_table("faq_items")
