from typing import Any

from pydantic import BaseModel, Field


class AttemptStartInput(BaseModel):
    test_slug: str = Field(pattern="^[a-z0-9-]{2,120}$")


class AnswerInput(BaseModel):
    question_id: str = Field(min_length=1, max_length=120)
    answer: str | int | float | bool


class AttemptCompleteInput(BaseModel):
    telemetry: dict[str, Any] = Field(default_factory=dict)


class AttemptStateOutput(BaseModel):
    id: str
    status: str
    definition_version: str
    current_question: dict[str, Any] | None
    expires_at: str
    challenge: dict[str, Any] | None = None


class AttemptCompletionOutput(BaseModel):
    id: str
    status: str
    definition_version: str
    completed_at: str
    expires_at: str
    result: dict[str, Any]
    save_consent_required: bool = True


class SavedResultOutput(BaseModel):
    id: str
    test_slug: str
    test_type: str
    test_title: str
    methodology_name: str
    methodology_version: str
    definition_version: str
    compatibility_conditions: dict[str, Any]
    result: dict[str, Any]
    limitations: str
    warnings: list[str]
    completed_at: str


class ComparisonOutput(BaseModel):
    test_slug: str
    methodology_version: str
    definition_version: str
    compatibility_conditions: dict[str, Any]
    results: list[SavedResultOutput]


class PdfExportInput(BaseModel):
    include_result: bool = True
    include_methodology: bool = True
    include_limitations: bool = True
    include_warnings: bool = True
    include_answers: bool = False
    lang: str = "ru" 
