from typing import Annotated
from fastapi import APIRouter, Path, Response
from app.dependencies import DB, CurrentUser
from .schemas import MovieInput, WatchlistOutput, WatchlistCreated
from . import service
router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

@router.get("", response_model=list[WatchlistOutput])
def entries(db: DB, user: CurrentUser):
    return service.list_entries(db, user.id)

@router.post("", status_code=201, response_model=WatchlistCreated)
def add(data: MovieInput, db: DB, user: CurrentUser):
    return {"data": service.add_entry(db, user.id, data.movie_id)}

@router.delete("/{movie_id}", status_code=204)
def delete(movie_id: Annotated[int, Path(gt=0)], db: DB, user: CurrentUser):
    service.delete_entry(db, user.id, movie_id)
    return Response(status_code=204)
