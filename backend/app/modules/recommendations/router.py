from typing import Annotated
from fastapi import APIRouter, Depends
from app.dependencies import DB
from .schemas import RecommendInput, RecommendOutput
from .client import OpenAICompatibleClient, get_recommendation_client
from .service import recommend
router = APIRouter(prefix="/movies", tags=["Recommendations"])

@router.post("/recommend", response_model=RecommendOutput)
def recommendation(data: RecommendInput, db: DB, client: Annotated[OpenAICompatibleClient, Depends(get_recommendation_client)]):
    return recommend(db, client, data.prompt)
