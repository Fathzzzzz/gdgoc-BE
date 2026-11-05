from pydantic import BaseModel, ConfigDict

class MovieOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    year: int
    director: str
    genres: list[str]
    rating: float
    duration: str
    synopsis: str
    poster_url: str
    cast: list[str]
