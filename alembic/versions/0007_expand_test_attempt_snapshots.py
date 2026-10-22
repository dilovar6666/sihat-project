"""Expand attempts without replacing the already-applied temporary schema."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0007_expand_attempts"
down_revision: str | None = "0006_test_attempts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "test_attempts", sa.Column("definition_version", sa.String(length=80), nullable=True)
    )
    op.add_column("test_attempts", sa.Column("definition_snapshot", sa.JSON(), nullable=True))
    op.add_column(
        "test_attempts", sa.Column("current_question_id", sa.String(length=120), nullable=True)
    )
    op.execute(
        "UPDATE test_attempts SET definition_version = questionnaire_version WHERE definition_version IS NULL"
    )
    op.execute(
        "UPDATE test_attempts SET definition_snapshot = snapshot WHERE definition_snapshot IS NULL"
    )


def downgrade() -> None:
    op.drop_column("test_attempts", "current_question_id")
    op.drop_column("test_attempts", "definition_snapshot")
    op.drop_column("test_attempts", "definition_version")
