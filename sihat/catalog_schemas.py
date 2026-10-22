from pydantic import BaseModel, Field


class CategoryInput(BaseModel):
    slug: str = Field(pattern="^[a-z0-9-]{2,80}$")
    localizations: dict[str, dict[str, str]]
    sort_order: int = Field(default=0, ge=0)


class TestInput(BaseModel):
    category_id: str
    slug: str = Field(pattern="^[a-z0-9-]{2,120}$")
    test_type: str = Field(
        pattern="^(validated_screening|digital_check|educational_exercise|symptom_questionnaire)$"
    )
    guest_allowed: bool = False
    min_age: int = Field(default=16, ge=0, le=120)
    max_age: int | None = Field(default=None, ge=0, le=120)
    localizations: dict[str, dict[str, str]]
    test_engine_key: str | None = Field(default=None, max_length=80)


class PassportInput(BaseModel):
    methodology_name: str = Field(min_length=1, max_length=240)
    methodology_version: str = Field(min_length=1, max_length=80)
    evidence_status: str = Field(pattern="^(validated|digital|educational|pending_review)$")
    evidence_source: str | None = Field(default=None, max_length=2048)
    license_info: str | None = None
    allowed_languages: list[str] = Field(default_factory=list)
    device_conditions: list[str] = Field(default_factory=list)
    scoring_summary: str | None = None
    interpretation_summary: str | None = None
    limitations: str = Field(min_length=1)
    warnings: list[str] = Field(default_factory=list)
