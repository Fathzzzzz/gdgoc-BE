"""Create FilmLog tables and database integrity constraints."""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email"))
    op.create_table("movies",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("director", sa.String(255), nullable=False),
        sa.Column("genres", sa.JSON(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=False),
        sa.Column("duration", sa.String(50), nullable=False),
        sa.Column("synopsis", sa.Text(), nullable=False),
        sa.Column("poster_url", sa.Text(), nullable=False),
        sa.Column("cast", sa.JSON(), nullable=False))
    op.create_table("watchlists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("movie_id", sa.Integer(), sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "movie_id", name="uq_watchlist_owner_movie"))
    op.create_table("reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("movie_id", sa.Integer(), sa.ForeignKey("movies.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("review", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"))
    op.create_index("ix_reviews_user_time", "reviews", ["user_id", "created_at"])


def downgrade():
    op.drop_index("ix_reviews_user_time", table_name="reviews")
    op.drop_table("reviews")
    op.drop_table("watchlists")
    op.drop_table("movies")
    op.drop_table("users")
