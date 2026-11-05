"""Run from backend: python -m app.scripts.seed. Never deletes user data."""
import json
from pathlib import Path
from sqlalchemy.dialects.postgresql import insert
from app.database.models import Movie
from app.database.session import SessionLocal

DATASET = Path(__file__).resolve().parents[3] / "data" / "movies.json"

def seed():
    movies = json.loads(DATASET.read_text(encoding="utf-8"))
    with SessionLocal.begin() as db:
        db.execute(insert(Movie).values(movies).on_conflict_do_nothing(index_elements=["id"]))
    return len(movies)

if __name__ == "__main__":
    print(f"Seed complete: {seed()} starter movies checked.")
