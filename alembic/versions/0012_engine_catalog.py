"""Publish the approved interactive exercises and hide everything else (no data is deleted).

Revision ID: 0012_engine_catalog
Revises: 0011_user_phone
"""

from collections.abc import Sequence

from sqlalchemy.orm import Session

from alembic import op

revision: str = "0012_engine_catalog"
down_revision: str | None = "0011_user_phone"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    from sihat.engine_catalog import sync_engine_catalog

    session = Session(bind=op.get_bind())
    report = sync_engine_catalog(session, hide_unapproved=True)
    session.flush()
    print(f"engine catalog: created={report['created']} hidden={report['hidden']}")


def downgrade() -> None:
    # Data migration: tests are only ever hidden, never deleted, so nothing is reverted.
    pass
