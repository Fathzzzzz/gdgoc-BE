from typing import Annotated
from fastapi import APIRouter, Path, Query
from app.dependencies import DB
from .schemas import MovieOutput
from .repository import get_movie, list_movies
router = APIRouter(prefix="/movies", tags=["Movies"])

@router.get("", response_model=list[MovieOutput])
def discover(db: DB, search: Annotated[str | None, Query(max_length=255)] = None, genre: Annotated[str | None, Query(max_length=100)] = None, shuffle: bool = False):
    return list_movies(db, search, genre, shuffle)

@router.get("/{movie_id}", response_model=MovieOutput)
def detail(movie_id: Annotated[int, Path(gt=0)], db: DB):
    return get_movie(db, movie_id)
