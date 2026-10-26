"""Add phone column to users and make email nullable.

Revision ID: 0011_user_phone
Revises: 0010_user_avatar_url
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0011_user_phone"
down_revision: str | None = "0010_user_avatar_url"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("users")]
    if "phone" not in columns:
        op.add_column("users", sa.Column("phone", sa.String(32), nullable=True))
        op.create_index("ix_users_phone", "users", ["phone"], unique=True)

    # Alter email to allow NULL values for phone-only registered users
    op.alter_column("users", "email", nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("users")]
    if "phone" in columns:
        op.drop_index("ix_users_phone", table_name="users")
        op.drop_column("users", "phone")

    op.alter_column("users", "email", nullable=False)
