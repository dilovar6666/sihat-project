from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class FaqItemInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=64)
    question: dict[str, str]
    answer: dict[str, str]
    sort_order: int = 0
    is_published: bool = True


class FaqItemUpdateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str | None = Field(default=None, min_length=2, max_length=120)
    category: str | None = Field(default=None, min_length=2, max_length=64)
    question: dict[str, str] | None = None
    answer: dict[str, str] | None = None
    sort_order: int | None = None
    is_published: bool | None = None


class FaqItemOutput(BaseModel):
    id: str
    slug: str
    category: str
    question: dict[str, str]
    answer: dict[str, str]
    sort_order: int
    is_published: bool
    created_at: str


class KnowledgeArticleInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=64)
    sort_order: int = 0
    is_published: bool = True
    localizations: dict[str, dict[str, str]]


class KnowledgeArticleUpdateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str | None = Field(default=None, min_length=2, max_length=120)
    category: str | None = Field(default=None, min_length=2, max_length=64)
    sort_order: int | None = None
    is_published: bool | None = None
    localizations: dict[str, dict[str, str]] | None = None


class KnowledgeArticleOutput(BaseModel):
    id: str
    slug: str
    category: str
    sort_order: int
    is_published: bool
    localizations: dict[str, dict[str, str]]
    created_at: str


class SupportTicketCreateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contact_email: EmailStr
    subject: str = Field(min_length=3, max_length=240)
    message: str = Field(min_length=10, max_length=4000)


class SupportTicketUpdateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["open", "in_progress", "resolved", "closed"] | None = None
    admin_notes: str | None = Field(default=None, max_length=4000)


class SupportTicketOutput(BaseModel):
    id: str
    user_id: str | None
    contact_email: str
    subject: str
    message: str
    status: str
    admin_notes: str | None
    created_at: str
