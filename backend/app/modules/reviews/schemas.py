from datetime import datetime
from pydantic import ConfigDict, Field, AliasChoices, field_validator
from app.modules.watchlist.schemas import MovieInput
from app.modules.movies.schemas import MovieOutput
from pydantic import BaseModel

class ReviewInput(MovieInput):
    rating: int = Field(ge=1, le=5, strict=True)
    review: str = Field(min_length=1, max_length=2000, validation_alias=AliasChoices("review", "opinion"))

    @field_validator("review", mode="before")
    @classmethod
    def trim_review(cls, value):
        return value.strip() if isinstance(value, str) else value

class ReviewOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    movie_id: int
    rating: int
    review: str
    created_at: datetime
    movie: MovieOutput
