from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DRAFT_NOTE: str = (
    "AI draft for administrative review. Must be verified for accuracy and sources before"
    " publication."
)


class AdminUserOutput(BaseModel):
    id: str
    email: str | None = None
    phone: str | None = None
    full_name: str
    role: str
    age_group: str
    is_active: bool
    created_at: str


class AdminUserUpdateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "admin"] | None = None
    is_active: bool | None = None


class AdminDashboardOutput(BaseModel):
    total_users: int
    users_by_age_group: dict[str, int]
    active_users: int
    inactive_users: int
    total_categories: int
    tests_by_status: dict[str, int]
    tests_by_type: dict[str, int]
    total_completed_attempts: int
    total_saved_results: int
    tickets_by_status: dict[str, int]


class AdminCategoryUpdateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    localizations: dict[str, dict[str, str]] | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class AdminCategoryOutput(BaseModel):
    id: str
    slug: str
    localizations: dict[str, dict[str, str]]
    sort_order: int
    is_active: bool
    tests_count: int


class AdminTestUpdateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    guest_allowed: bool | None = None
    min_age: int | None = Field(default=None, ge=0, le=120)
    max_age: int | None = Field(default=None, ge=0, le=120)
    test_type: (
        Literal[
            "validated_screening",
            "digital_check",
            "educational_exercise",
            "symptom_questionnaire",
        ]
        | None
    ) = None
    test_engine_key: str | None = None
    localizations: dict[str, dict[str, str]] | None = None


class ContentDraftInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str = Field(min_length=3, max_length=200)
    content_type: Literal["faq", "article"]
    language: Literal["ru", "tg", "en"] = "ru"


class ContentDraftOutput(BaseModel):
    title: str
    content: str
    note: str = DRAFT_NOTE
