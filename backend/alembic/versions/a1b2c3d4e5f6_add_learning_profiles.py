"""add_learning_profiles

Revision ID: a1b2c3d4e5f6
Revises: bbc4e6a258f3
Create Date: 2026-06-14 18:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'bbc4e6a258f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Alter Users table to make educational_level nullable
    op.alter_column('users', 'educational_level',
               existing_type=postgresql.ENUM('PRIMARY', 'JSS', 'SSS', 'POLYTECHNIC', 'COL_OF_EDU', 'UNIVERSITY', name='educationallevel'),
               nullable=True)

    # 2. Create Enum for Persona
    dashboardpersona = postgresql.ENUM('EXAM_CANDIDATE', 'TERTIARY_STUDENT', 'EDUCATOR', name='dashboardpersona', create_type=False)
    dashboardpersona.create(op.get_bind(), checkfirst=True)

    # 3. Create learning_profiles table
    op.create_table('learning_profiles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('persona', dashboardpersona, nullable=False),
    sa.Column('academic_category', sa.String(length=100), nullable=False),
    sa.Column('institution_name', sa.String(length=300), nullable=True),
    sa.Column('faculty', sa.String(length=200), nullable=True),
    sa.Column('department', sa.String(length=200), nullable=True),
    sa.Column('academic_level', sa.String(length=100), nullable=True),
    sa.Column('target_exam', sa.String(length=100), nullable=True),
    sa.Column('preferred_subjects', sa.ARRAY(sa.String()), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_learning_profiles_user_id'), 'learning_profiles', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_learning_profiles_user_id'), table_name='learning_profiles')
    op.drop_table('learning_profiles')
    
    dashboardpersona = postgresql.ENUM('EXAM_CANDIDATE', 'TERTIARY_STUDENT', 'EDUCATOR', name='dashboardpersona')
    dashboardpersona.drop(op.get_bind(), checkfirst=True)

    op.alter_column('users', 'educational_level',
               existing_type=postgresql.ENUM('PRIMARY', 'JSS', 'SSS', 'POLYTECHNIC', 'COL_OF_EDU', 'UNIVERSITY', name='educationallevel'),
               nullable=False)
