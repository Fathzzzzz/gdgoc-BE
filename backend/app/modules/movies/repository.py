from sqlalchemy import select, or_, func
from app.database.models import Movie
from app.core.errors import fail

def get_movie(db, movie_id):
    movie = db.get(Movie, movie_id)
    if movie is None:
        fail(404, "Film tidak ditemukan.", "MOVIE_NOT_FOUND")
    return movie

def list_movies(db, search=None, genre=None, shuffle=False):
    query = select(Movie)
    if search:
        query = query.where(or_(Movie.title.icontains(search, autoescape=True), Movie.director.icontains(search, autoescape=True)))
    query = query.order_by(func.random() if shuffle else Movie.id)
    movies = list(db.scalars(query))
    if genre:
        movies = [movie for movie in movies if genre.casefold() in {g.casefold() for g in movie.genres}]
    return movies
