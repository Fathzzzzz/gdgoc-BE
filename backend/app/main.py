import logging
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.modules.auth.router import router as auth
from app.modules.movies.router import router as movies
from app.modules.watchlist.router import router as watchlist
from app.modules.reviews.router import router as reviews

logger = logging.getLogger("filmlog")
app = FastAPI(title="FilmLog API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origins, allow_methods=["GET", "POST", "DELETE"], allow_headers=["Authorization", "Content-Type"])

@app.exception_handler(HTTPException)
async def http_error(request, exc):
    body = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail), "code": "HTTP_ERROR"}
    return JSONResponse(body, status_code=exc.status_code, headers=exc.headers)

@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    return JSONResponse({"message": "Input tidak valid. Periksa tipe, format, dan batas nilai.", "code": "VALIDATION_ERROR", "fields": [".".join(map(str, error["loc"])) for error in exc.errors()]}, status_code=400)

@app.exception_handler(Exception)
async def internal_error(request, exc):
    # Do not log SQL parameters, passwords, tokens or provider bodies.
    logger.error("Unhandled error: %s", type(exc).__name__)
    return JSONResponse({"message": "Terjadi kesalahan internal.", "code": "INTERNAL_ERROR"}, status_code=500)

@app.middleware("http")
async def request_timing(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    logger.info("%s %s %d %.1fms", request.method, request.url.path, response.status_code, (time.perf_counter()-start)*1000)
    return response

for router in [auth, movies, watchlist, reviews]:
    app.include_router(router, prefix="/api")

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
