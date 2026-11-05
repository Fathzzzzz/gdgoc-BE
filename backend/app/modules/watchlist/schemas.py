from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.modules.movies.schemas import MovieOutput

class MovieInput(BaseModel):
    movie_id: int = Field(validation_alias=AliasChoices("movieId", "movie_id"), gt=0, strict=True)

class WatchlistOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    movie_id: int
    movie: MovieOutput
    created_at: datetime

class WatchlistCreated(BaseModel):
    data: WatchlistOutput
