from fastapi import HTTPException

def fail(status: int, message: str, code: str):
    raise HTTPException(status_code=status, detail={"message": message, "code": code})
