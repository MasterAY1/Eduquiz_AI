"""Initial database schema.

Revision ID: 001
Revises: None
Create Date: 2026-06-04 23:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("educational_level", sa.String(length=50), nullable=False),
        sa.Column("school_name", sa.String(length=300), nullable=True),
        sa.Column("department", sa.String(length=200), nullable=True),
        sa.Column("class_level", sa.String(length=100), nullable=True),
        sa.Column("preferred_subjects", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("xp_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_active_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # 3. Create refresh_tokens table
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(length=512), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_refresh_tokens_token_hash"), "refresh_tokens", ["token_hash"], unique=True)
    op.create_index(op.f("ix_refresh_tokens_user_id"), "refresh_tokens", ["user_id"], unique=False)

    # 4. Create documents table
    op.create_table(
        "documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("original_filename", sa.String(length=500), nullable=True),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("subject", sa.String(length=200), nullable=True),
        sa.Column("detected_level", sa.String(length=100), nullable=True),
        sa.Column("topics", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("subtopics", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("word_count", sa.Integer(), nullable=True),
        sa.Column("chunk_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("analysis_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_documents_user_id"), "documents", ["user_id"], unique=False)

    # 5. Create document_chunks table
    op.create_table(
        "document_chunks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=False),
        sa.Column("embedding", Vector(dim=768), nullable=False),
        sa.Column("chunk_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_document_chunks_document_id"), "document_chunks", ["document_id"], unique=False)

    # 6. Create quizzes table
    op.create_table(
        "quizzes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("quiz_mode", sa.String(length=50), nullable=False, server_default="practice"),
        sa.Column("exam_style", sa.String(length=50), nullable=False, server_default="standard"),
        sa.Column("subject", sa.String(length=200), nullable=True),
        sa.Column("difficulty", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column("time_limit_minutes", sa.Integer(), nullable=True),
        sa.Column("is_randomized", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("language", sa.String(length=10), nullable=False, server_default="en"),
        sa.Column("model_used", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_quizzes_document_id"), "quizzes", ["document_id"], unique=False)
    op.create_index(op.f("ix_quizzes_user_id"), "quizzes", ["user_id"], unique=False)

    # 7. Create questions table
    op.create_table(
        "questions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("quiz_id", sa.UUID(), nullable=False),
        sa.Column("question_number", sa.Integer(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(length=30), nullable=False),
        sa.Column("options", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("correct_answer", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("topic_reference", sa.String(length=300), nullable=True),
        sa.Column("difficulty", sa.String(length=20), nullable=True),
        sa.Column("marks", sa.Numeric(precision=5, scale=2), nullable=False, server_default="1.00"),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_questions_quiz_id"), "questions", ["quiz_id"], unique=False)

    # 8. Create quiz_attempts table
    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("quiz_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("time_taken_seconds", sa.Integer(), nullable=True),
        sa.Column("score", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("max_score", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("percentage", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("answers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("ai_feedback", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("overall_evaluation", sa.Text(), nullable=True),
        sa.Column("xp_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_quiz_attempts_quiz_id"), "quiz_attempts", ["quiz_id"], unique=False)
    op.create_index(op.f("ix_quiz_attempts_user_id"), "quiz_attempts", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_quiz_attempts_user_id"), table_name="quiz_attempts")
    op.drop_index(op.f("ix_quiz_attempts_quiz_id"), table_name="quiz_attempts")
    op.drop_table("quiz_attempts")
    op.drop_index(op.f("ix_questions_quiz_id"), table_name="questions")
    op.drop_table("questions")
    op.drop_index(op.f("ix_quizzes_user_id"), table_name="quizzes")
    op.drop_index(op.f("ix_quizzes_document_id"), table_name="quizzes")
    op.drop_table("quizzes")
    op.drop_index(op.f("ix_document_chunks_document_id"), table_name="document_chunks")
    op.drop_table("document_chunks")
    op.drop_index(op.f("ix_documents_user_id"), table_name="documents")
    op.drop_table("documents")
    op.drop_index(op.f("ix_refresh_tokens_user_id"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_token_hash"), table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.execute("DROP EXTENSION IF EXISTS vector")
