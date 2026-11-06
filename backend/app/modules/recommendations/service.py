import json
from sqlalchemy import select
from pydantic import ValidationError
from app.database.models import Movie
from app.scripts.seed import DATASET
from app.core.errors import fail
from .schemas import RecommendOutput

def recommend(db, client, prompt):
    starter_ids = {m["id"] for m in json.loads(DATASET.read_text(encoding="utf-8"))}
    movies = list(db.scalars(select(Movie).where(Movie.id.in_(starter_ids)).order_by(Movie.id)))
    if not movies:
        fail(503, "Katalog rekomendasi belum tersedia. Jalankan seeding.", "CATALOG_UNAVAILABLE")
    catalog = [{"id": m.id, "title": m.title, "genres": m.genres, "synopsis": m.synopsis, "director": m.director, "year": m.year} for m in movies]
    result = client.generate(catalog, prompt)
    try:
        output = RecommendOutput.model_validate(result)
    except ValidationError:
        fail(502, "Respons provider rekomendasi tidak valid.", "RECOMMENDATION_INVALID_OUTPUT")
    if output.movie_id not in {m.id for m in movies}:
        fail(502, "Provider memilih film di luar katalog awal.", "RECOMMENDATION_INVALID_OUTPUT")
    return output
