"""Publish color-perception screening exercise in the catalog.

Revision ID: 0013_publish_color_perception
Revises: 0012_engine_catalog
"""

from collections.abc import Sequence

from sqlalchemy.orm import Session

from alembic import op

revision: str = "0013_publish_color_perception"
down_revision: str | None = "0012_engine_catalog"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    from sihat.engine_catalog import sync_engine_catalog

    session = Session(bind=op.get_bind())
    report = sync_engine_catalog(session, hide_unapproved=True)
    session.flush()
    print(f"engine catalog updated: created={report['created']} hidden={report['hidden']}")


def downgrade() -> None:
    pass
