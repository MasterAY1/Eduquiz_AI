"""Add model usage stats table.

Revision ID: 003
Revises: 002
Create Date: 2026-06-08 02:40:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "model_usage_stats",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("date", sa.Date(), server_default=sa.text("CURRENT_DATE"), nullable=False),
        sa.Column("requests_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("tokens_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("successful_requests", sa.Integer(), server_default="0", nullable=False),
        sa.Column("failed_requests", sa.Integer(), server_default="0", nullable=False),
        sa.Column("average_response_time_ms", sa.Numeric(precision=12, scale=2), server_default="0.00", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("model_name", "date", name="uq_model_name_date"),
    )
    op.create_index(op.f("ix_model_usage_stats_model_name"), "model_usage_stats", ["model_name"], unique=False)
    op.create_index(op.f("ix_model_usage_stats_date"), "model_usage_stats", ["date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_model_usage_stats_date"), table_name="model_usage_stats")
    op.drop_index(op.f("ix_model_usage_stats_model_name"), table_name="model_usage_stats")
    op.drop_table("model_usage_stats")
