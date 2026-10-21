"""Establish the SIHAT migration history.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-10-21
"""

from collections.abc import Sequence

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Reserve the baseline revision before domain tables are introduced."""


def downgrade() -> None:
    """Remove the baseline revision marker."""

