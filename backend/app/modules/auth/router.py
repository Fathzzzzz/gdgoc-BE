from fastapi import APIRouter
from app.dependencies import DB
from .schemas import RegisterInput, LoginInput, UserOutput, LoginOutput
from . import service
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", status_code=201, response_model=UserOutput)
def register(data: RegisterInput, db: DB):
    return service.register(db, data)

@router.post("/login", response_model=LoginOutput)
def login(data: LoginInput, db: DB):
    return service.login(db, data)
