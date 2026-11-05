from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.database.models import Watchlist
from app.modules.movies.repository import get_movie
from app.core.errors import fail

def list_entries(db, user_id):
    return list(db.scalars(select(Watchlist).where(Watchlist.user_id == user_id).order_by(Watchlist.created_at.desc(), Watchlist.id.desc())))

def add_entry(db, user_id, movie_id):
    get_movie(db, movie_id)
    entry = Watchlist(user_id=user_id, movie_id=movie_id)
    db.add(entry)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        fail(409, "Film sudah ada di watchlist.", "WATCHLIST_DUPLICATE")
    db.refresh(entry)
    return entry

def delete_entry(db, user_id, movie_id):
    entry = db.scalar(select(Watchlist).where(Watchlist.user_id == user_id, Watchlist.movie_id == movie_id))
    if entry is None:
        fail(404, "Entri watchlist tidak ditemukan.", "WATCHLIST_NOT_FOUND")
    db.delete(entry)
    db.commit()
