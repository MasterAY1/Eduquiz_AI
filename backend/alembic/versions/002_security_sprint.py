"""Security sprint schema updates.

Revision ID: 002
Revises: 001
Create Date: 2026-06-06 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create user_quotas table
    op.create_table(
        "user_quotas",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("plan_type", sa.String(length=50), server_default="free", nullable=False),
        sa.Column("uploads_used_today", sa.Integer(), server_default="0", nullable=False),
        sa.Column("quizzes_generated_today", sa.Integer(), server_default="0", nullable=False),
        sa.Column("ai_requests_today", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_reset_date", sa.Date(), server_default=sa.text("CURRENT_DATE"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    # 2. Create cached_ai_responses table
    op.create_table(
        "cached_ai_responses",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("cache_key", sa.String(length=64), nullable=False),
        sa.Column("prompt_hash", sa.String(length=64), nullable=False),
        sa.Column("response_text", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(length=100), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cached_ai_responses_cache_key"), "cached_ai_responses", ["cache_key"], unique=True)

    # 3. Create ai_usage_logs table
    op.create_table(
        "ai_usage_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("request_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("document_id", sa.UUID(), nullable=True),
        sa.Column("quiz_id", sa.UUID(), nullable=True),
        sa.Column("provider", sa.String(length=100), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("operation", sa.String(length=100), nullable=False),
        sa.Column("input_tokens", sa.Integer(), server_default="0", nullable=False),
        sa.Column("output_tokens", sa.Integer(), server_default="0", nullable=False),
        sa.Column("estimated_cost", sa.Numeric(precision=10, scale=6), server_default="0.000000", nullable=False),
        sa.Column("response_time_ms", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_usage_logs_document_id"), "ai_usage_logs", ["document_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_logs_quiz_id"), "ai_usage_logs", ["quiz_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_logs_request_id"), "ai_usage_logs", ["request_id"], unique=False)
    op.create_index(op.f("ix_ai_usage_logs_user_id"), "ai_usage_logs", ["user_id"], unique=False)

    # 4. Create system_events table
    op.create_table(
        "system_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_system_events_event_type"), "system_events", ["event_type"], unique=False)

    # 5. Create audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("ip_address", sa.String(length=100), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_audit_logs_user_id"), "audit_logs", ["user_id"], unique=False)

    # 6. Create HNSW index on document_chunks.embedding using cosine distance
    op.execute(
        "CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS document_chunks_embedding_hnsw_idx;")
    op.drop_index(op.f("ix_audit_logs_user_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index(op.f("ix_system_events_event_type"), table_name="system_events")
    op.drop_table("system_events")
    op.drop_index(op.f("ix_ai_usage_logs_user_id"), table_name="ai_usage_logs")
    op.drop_index(op.f("ix_ai_usage_logs_request_id"), table_name="ai_usage_logs")
    op.drop_index(op.f("ix_ai_usage_logs_quiz_id"), table_name="ai_usage_logs")
    op.drop_index(op.f("ix_ai_usage_logs_document_id"), table_name="ai_usage_logs")
    op.drop_table("ai_usage_logs")
    op.drop_index(op.f("ix_cached_ai_responses_cache_key"), table_name="cached_ai_responses")
    op.drop_table("cached_ai_responses")
    op.drop_table("user_quotas")
