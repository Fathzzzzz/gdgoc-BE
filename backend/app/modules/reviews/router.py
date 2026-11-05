from fastapi import APIRouter
from sqlalchemy import select
from app.database.models import Review
from app.dependencies import DB, CurrentUser
from app.modules.movies.repository import get_movie
from .schemas import ReviewInput, ReviewOutput
router = APIRouter(prefix="/watched", tags=["Watched & Reviews"])

@router.get("", response_model=list[ReviewOutput])
def history(db: DB, user: CurrentUser):
    return list(db.scalars(select(Review).where(Review.user_id == user.id).order_by(Review.created_at.desc(), Review.id.desc())))

@router.post("", status_code=201, response_model=ReviewOutput)
def log(data: ReviewInput, db: DB, user: CurrentUser):
    get_movie(db, data.movie_id)
    entry = Review(user_id=user.id, movie_id=data.movie_id, rating=data.rating, review=data.review)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
