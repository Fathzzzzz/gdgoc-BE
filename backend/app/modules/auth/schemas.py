from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

class RegisterInput(LoginInput):
    username: str = Field(min_length=3, max_length=50)

    @field_validator("username", mode="before")
    @classmethod
    def trim_username(cls, value):
        return value.strip() if isinstance(value, str) else value

class UserOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str

class LoginOutput(BaseModel):
    token: str
    user: UserOutput
