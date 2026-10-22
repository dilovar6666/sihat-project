from typing import Any

from pydantic import BaseModel, Field


class AttemptStartInput(BaseModel):
    test_slug: str = Field(pattern="^[a-z0-9-]{2,120}$")


class AnswerInput(BaseModel):
    question_id: str = Field(min_length=1, max_length=120)
    answer: str | int | float | bool


class AttemptStateOutput(BaseModel):
    id: str
    status: str
    definition_version: str
    current_question: dict[str, Any] | None
    expires_at: str


class AttemptCompletionOutput(BaseModel):
    id: str
    status: str
    definition_version: str
    completed_at: str
    expires_at: str
    result: dict[str, Any]
    save_consent_required: bool = True
