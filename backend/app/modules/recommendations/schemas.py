from pydantic import BaseModel, Field, AliasChoices, field_validator

class RecommendInput(BaseModel):
    prompt: str = Field(min_length=1, max_length=1000, validation_alias=AliasChoices("prompt", "query", "description"))

    @field_validator("prompt", mode="before")
    @classmethod
    def trim_prompt(cls, value):
        return value.strip() if isinstance(value, str) else value

class RecommendOutput(BaseModel):
    movie_id: int = Field(strict=True, gt=0)
    reasoning: str = Field(min_length=1, max_length=2000)

    @field_validator("reasoning", mode="before")
    @classmethod
    def trim_reasoning(cls, value):
        return value.strip() if isinstance(value, str) else value
