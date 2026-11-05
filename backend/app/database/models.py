from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, UniqueConstraint, CheckConstraint, Index, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(320), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Movie(Base):
    __tablename__ = "movies"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    title: Mapped[str] = mapped_column(String(255))
    year: Mapped[int]
    director: Mapped[str] = mapped_column(String(255))
    genres: Mapped[list[str]] = mapped_column(JSON)
    rating: Mapped[float]
    duration: Mapped[str] = mapped_column(String(50))
    synopsis: Mapped[str] = mapped_column(Text)
    poster_url: Mapped[str] = mapped_column(Text)
    cast: Mapped[list[str]] = mapped_column(JSON)

class Watchlist(Base):
    __tablename__ = "watchlists"
    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_watchlist_owner_movie"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    movie: Mapped[Movie] = relationship(lazy="joined")

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"), Index("ix_reviews_user_time", "user_id", "created_at"))
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))
    rating: Mapped[int]
    review: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    movie: Mapped[Movie] = relationship(lazy="joined")
