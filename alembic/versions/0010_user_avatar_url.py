"""Add avatar_url to users.

Revision ID: 0010_user_avatar_url
Revises: 0009_admin_and_content
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0010_user_avatar_url"
down_revision: str | None = "0009_admin_and_content"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Safely add column if not exists
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("users")]
    if "avatar_url" not in columns:
        op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("users")]
    if "avatar_url" in columns:
        op.drop_column("users", "avatar_url")
