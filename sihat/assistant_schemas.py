from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class DialogMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=2000)


class AssistantMessageInput(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    conversation: list[DialogMessage] = Field(default_factory=list, max_length=12)
    shared_result_ids: list[str] = Field(default_factory=list, max_length=3)
    api_key: str | None = None
    lang: str | None = None

    @field_validator("shared_result_ids")
    @classmethod
    def unique_result_ids(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("shared_result_ids must not contain duplicates")
        return value


class AssistantAction(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    requires_confirmation: bool = False


class AssistantMessageOutput(BaseModel):
    message: str
    actions: list[AssistantAction] = Field(default_factory=list)
    provider_available: bool
