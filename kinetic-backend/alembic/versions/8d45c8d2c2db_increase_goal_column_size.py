"""Increase goal column size

Revision ID: 8d45c8d2c2db
Revises: d7fdc7842532
Create Date: 2025-12-15 19:46:47.401036

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8d45c8d2c2db'
down_revision: Union[str, Sequence[str], None] = 'd7fdc7842532'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Just alter the column, don't drop tables
    op.alter_column('training_programs', 'goal',
                    existing_type=sa.String(length=100),
                    type_=sa.String(length=500),
                    existing_nullable=True)


def downgrade() -> None:
    # Revert the column change
    op.alter_column('training_programs', 'goal',
                    existing_type=sa.String(length=500),
                    type_=sa.String(length=100),
                    existing_nullable=True)