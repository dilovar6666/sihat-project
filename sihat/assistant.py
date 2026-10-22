"""Safe current-dialog assistant with a typed, validated UI-action allowlist."""

from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.assistant_schemas import AssistantAction, AssistantMessageInput, AssistantMessageOutput
from sihat.auth import get_current_user
from sihat.config import Settings, get_settings
from sihat.db import get_db_session
from sihat.gemini import GeminiUnavailableError, generate_assistant_response
from sihat.models import SavedResult, TestDefinition, User

router = APIRouter(prefix="/assistant", tags=["assistant"])
_timestamps: dict[str, deque[float]] = defaultdict(deque)
_MAX_MESSAGES = 12
_WINDOW_SECONDS = 60.0
_ALLOWED_ACTIONS = {
    "navigate_to_page",
    "open_test",
    "search_tests",
    "filter_category",
    "scroll_to_section",
    "highlight_element",
    "open_test_description",
    "open_profile",
    "show_test_results",
    "prepare_test_start",
}


def clear_assistant_rate_limits() -> None:
    _timestamps.clear()


def _enforce_rate_limit(key: str) -> None:
    now = monotonic()
    timestamps = _timestamps[key]
    while timestamps and timestamps[0] <= now - _WINDOW_SECONDS:
        timestamps.popleft()
    if len(timestamps) >= _MAX_MESSAGES:
        raise HTTPException(
            status_code=429, detail="Too many assistant messages; try again shortly"
        )
    timestamps.append(now)


def _safe_result_context(db: Session, user: User, result_ids: list[str]) -> list[dict[str, object]]:
    if not result_ids:
        return []
    results = db.scalars(
        select(SavedResult).where(SavedResult.user_id == user.id, SavedResult.id.in_(result_ids))
    ).all()
    if len(results) != len(result_ids):
        raise HTTPException(status_code=404, detail="A shared result was not found")
    return [
        {
            "id": item.id,
            "test_title": item.test_title,
            "test_type": item.test_type,
            "methodology_version": item.methodology_version,
            "result": item.result,
            "limitations": item.limitations,
            "warnings": item.warnings,
        }
        for item in results
    ]


def _validated_action(action: object, db: Session, user: User) -> AssistantAction | None:
    if not isinstance(action, dict) or not isinstance(action.get("name"), str):
        return None
    name = action["name"]
    arguments = action.get("arguments", {})
    if name not in _ALLOWED_ACTIONS or not isinstance(arguments, dict):
        return None
    if name in {"open_test", "open_test_description", "prepare_test_start"}:
        slug = arguments.get("slug")
        if not isinstance(slug, str) or not db.scalar(
            select(TestDefinition.id).where(
                TestDefinition.slug == slug, TestDefinition.availability_status == "published"
            )
        ):
            return None
        return AssistantAction(
            name=name,
            arguments={"slug": slug},
            requires_confirmation=name == "prepare_test_start",
        )
    if name == "show_test_results":
        result_id = arguments.get("result_id")
        if not isinstance(result_id, str) or not db.get(SavedResult, result_id):
            return None
        if db.get(SavedResult, result_id).user_id != user.id:
            return None
        return AssistantAction(
            name=name, arguments={"result_id": result_id}, requires_confirmation=True
        )
    if name in {"navigate_to_page", "scroll_to_section", "highlight_element"}:
        target = arguments.get("target")
        if not isinstance(target, str) or len(target) > 120 or not target.startswith("/"):
            return None
        return AssistantAction(name=name, arguments={"target": target})
    if name in {"search_tests", "filter_category"}:
        query = arguments.get("query")
        if not isinstance(query, str) or not 1 <= len(query) <= 100:
            return None
        return AssistantAction(name=name, arguments={"query": query})
    if name == "open_profile":
        return AssistantAction(name=name)
    return None


def _fallback() -> AssistantMessageOutput:
    return AssistantMessageOutput(
        message=(
            "The assistant is unavailable right now. SIHAT can still help you browse exercises, "
            "but it does not diagnose conditions or prescribe treatment."
        ),
        provider_available=False,
    )


@router.post("/message", response_model=AssistantMessageOutput)
def send_message(
    payload: AssistantMessageInput,
    request: Request,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AssistantMessageOutput:
    _enforce_rate_limit(f"{user.id}:{request.client.host if request.client else 'unknown'}")
    shared_results = _safe_result_context(db, user, payload.shared_result_ids)
    conversation = [message.model_dump() for message in payload.conversation]
    conversation.append({"role": "user", "text": payload.text})
    try:
        raw = generate_assistant_response(
            settings=settings, conversation=conversation, shared_results=shared_results
        )
    except GeminiUnavailableError:
        return _fallback()
    message = raw.get("message")
    if not isinstance(message, str) or not message.strip() or len(message) > 2000:
        return _fallback()
    raw_actions = raw.get("actions", [])
    if not isinstance(raw_actions, list):
        return _fallback()
    actions = [
        validated
        for item in raw_actions
        if (validated := _validated_action(item, db, user)) is not None
    ]
    return AssistantMessageOutput(message=message.strip(), actions=actions, provider_available=True)
