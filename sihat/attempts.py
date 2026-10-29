"""Authenticated, temporary questionnaire attempts with dynamic challenge snapshots and server-side scoring."""

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from sihat.attempt_schemas import (
    AnswerInput,
    AttemptCompleteInput,
    AttemptCompletionOutput,
    AttemptStartInput,
    AttemptStateOutput,
)
from sihat.auth import get_current_user
from sihat.config import Settings, get_settings
from sihat.db import get_db_session
from sihat.models import MethodologyPassport, Questionnaire, TestAttempt, TestDefinition, User
from sihat.rate_limit import enforce_auth_rate_limit
from sihat.security import is_expired
from sihat.test_generators import (
    ENGINE_SLUGS,
    TelemetryError,
    generate_challenge,
    public_challenge,
    score_attempt,
)

router = APIRouter(prefix="/attempts", tags=["attempts"])
guest_router = APIRouter(prefix="/guest-attempts", tags=["attempts"])
_MISSING = object()
_MAX_TELEMETRY_BYTES = 600_000
_GUEST_TOKEN_TYPE = "guest-attempt"
ENGINE_DEFINITION_VERSION = "engine-2"


def _result_context(test: TestDefinition, passport: MethodologyPassport) -> dict[str, Any]:
    return {
        "test_slug": test.slug,
        "test_type": test.test_type,
        "test_title": str(test.localizations.get("en", {}).get("title", test.slug)),
        "methodology_name": passport.methodology_name,
        "methodology_version": passport.methodology_version,
        "compatibility_conditions": {"device_conditions": list(passport.device_conditions)},
        "limitations": passport.limitations,
        "warnings": list(passport.warnings),
    }


def _safe_localizations(value: object) -> dict[str, dict[str, str]]:
    if not isinstance(value, dict):
        return {}
    allowed_keys = {"text", "label", "description", "help"}
    return {
        language: {
            key: text
            for key, text in translation.items()
            if key in allowed_keys and isinstance(text, str)
        }
        for language, translation in value.items()
        if isinstance(language, str) and isinstance(translation, dict)
    }


def _public_question(question: object) -> dict[str, Any]:
    if not isinstance(question, dict) or not isinstance(question.get("id"), str):
        raise ValueError("Each question needs a string id")
    public: dict[str, Any] = {
        "id": question["id"],
        "localizations": _safe_localizations(question.get("localizations")),
    }
    if isinstance(question.get("type"), str):
        public["type"] = question["type"]
    if isinstance(question.get("required"), bool):
        public["required"] = question["required"]
    if "options" in question:
        if not isinstance(question["options"], list):
            raise ValueError("Question options must be a list")
        options: list[dict[str, Any]] = []
        for option in question["options"]:
            if not isinstance(option, dict) or not isinstance(option.get("id"), str):
                raise ValueError("Each answer option needs a string id")
            options.append(
                {
                    "id": option["id"],
                    "localizations": _safe_localizations(option.get("localizations")),
                }
            )
        public["options"] = options
    return public


def _branch_rule(rule: object) -> tuple[str, object, str | None] | None:
    if not isinstance(rule, dict):
        raise ValueError("Branching rules must be objects")
    condition = rule.get("when", rule.get("if", rule))
    if not isinstance(condition, dict):
        raise ValueError("Branch condition must be an object")
    question_id = condition.get("question_id")
    answer = condition.get("equals", condition.get("answer_id", condition.get("answer", _MISSING)))
    if not isinstance(question_id, str) or answer is _MISSING:
        raise ValueError("Branch rules need question_id and equals")
    next_question_id = rule.get("next_question_id")
    if next_question_id is None and rule.get("complete") is not True:
        raise ValueError("Branch rules need next_question_id or complete")
    if next_question_id is not None and not isinstance(next_question_id, str):
        raise ValueError("next_question_id must be a string")
    return question_id, answer, next_question_id


def _definition_snapshot(questionnaire: Questionnaire) -> dict[str, Any]:
    questions = [_public_question(question) for question in questionnaire.questions]
    question_ids = [question["id"] for question in questions]
    if not questions or len(question_ids) != len(set(question_ids)):
        raise ValueError("Questionnaire needs unique question ids")
    for rule in questionnaire.branching_rules:
        question_id, _, next_question_id = _branch_rule(rule)
        if question_id not in question_ids or (
            next_question_id is not None and next_question_id not in question_ids
        ):
            raise ValueError("Branch rule references an unknown question")
    scoring: dict[str, dict[str, float]] = {}
    for question in questionnaire.questions:
        if isinstance(question, dict) and isinstance(question.get("id"), str):
            qid = question["id"]
            pts = question.get("points")
            if isinstance(pts, dict):
                scoring[qid] = {
                    str(answer): float(value)
                    for answer, value in pts.items()
                    if isinstance(value, int | float)
                }
            for opt in question.get("options", []):
                if isinstance(opt, dict) and isinstance(opt.get("id"), str):
                    opt_id = opt["id"]
                    opt_pts = opt.get("points")
                    if isinstance(opt_pts, int | float):
                        scoring.setdefault(qid, {})[opt_id] = float(opt_pts)
                    elif (
                        opt.get("correct_answer") is True
                        or opt_id == question.get("correct_answer_id")
                    ) and isinstance(pts, int | float):
                        scoring.setdefault(qid, {})[opt_id] = float(pts)

    if isinstance(questionnaire.scoring_config, dict):
        cfg_pts = questionnaire.scoring_config.get("points", {})
        if isinstance(cfg_pts, dict):
            for k, v in cfg_pts.items():
                if isinstance(v, int | float):
                    for q in questionnaire.questions:
                        qid = q.get("id")
                        if qid:
                            for opt in q.get("options", []):
                                if isinstance(opt, dict) and opt.get("id") == k:
                                    scoring.setdefault(qid, {})[k] = float(v)

    return {
        "questions": questions,
        "branching_rules": questionnaire.branching_rules,
        "scoring": scoring,
    }


def _state_output(attempt: TestAttempt) -> AttemptStateOutput:
    questions = attempt.definition_snapshot.get("questions", [])
    current_question = next(
        (question for question in questions if question["id"] == attempt.current_question_id), None
    )
    return AttemptStateOutput(
        id=attempt.id,
        status=attempt.status,
        definition_version=attempt.definition_version,
        current_question=current_question,
        expires_at=attempt.expires_at.isoformat(),
        challenge=public_challenge(attempt.definition_snapshot.get("challenge")),
    )


def _completion_output(attempt: TestAttempt) -> AttemptCompletionOutput:
    if attempt.completed_at is None:
        raise RuntimeError("Completed attempt is missing its completion time")
    if attempt.result is None:
        raise RuntimeError("Completed attempt is missing its result")
    return AttemptCompletionOutput(
        id=attempt.id,
        status=attempt.status,
        definition_version=attempt.definition_version,
        completed_at=attempt.completed_at.isoformat(),
        expires_at=attempt.expires_at.isoformat(),
        result=attempt.result,
    )


def _age_group_allows(test: TestDefinition, age_group: str) -> bool:
    if age_group == "16_17":
        return test.min_age <= 17 and (test.max_age is None or test.max_age >= 16)
    return test.max_age is None or test.max_age >= 18


async def _load_attempt(
    db: AsyncSession, attempt_id: str, user: User, *, for_update: bool = False
) -> TestAttempt:
    if for_update:
        # Row lock: concurrent completions of one attempt are serialised (PostgreSQL).
        attempt = await db.scalar(
            select(TestAttempt).where(TestAttempt.id == attempt_id).with_for_update()
        )
    else:
        attempt = await db.get(TestAttempt, attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(status_code=404, detail="Attempt was not found")
    if is_expired(attempt.expires_at):
        await db.delete(attempt)
        await db.commit()
        raise HTTPException(status_code=410, detail="Attempt has expired")
    return attempt


def _require_in_progress(attempt: TestAttempt) -> None:
    if attempt.status != "in_progress":
        raise HTTPException(status_code=409, detail="Attempt is already complete")


def _next_question_id(attempt: TestAttempt, answer: object) -> str | None:
    current_question_id = attempt.current_question_id
    for rule in attempt.definition_snapshot.get("branching_rules", []):
        question_id, expected, next_question_id = _branch_rule(rule)
        if question_id == current_question_id and answer == expected:
            return next_question_id
    questions = attempt.definition_snapshot.get("questions", [])
    current_index = next(
        (index for index, question in enumerate(questions) if question["id"] == current_question_id),
        -1,
    )
    if current_index == -1 or current_index + 1 >= len(questions):
        return None
    return questions[current_index + 1]["id"]


@router.post("/start", response_model=AttemptStateOutput, status_code=status.HTTP_201_CREATED)
async def start_attempt(
    payload: AttemptStartInput,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AttemptStateOutput:
    test = await db.scalar(
        select(TestDefinition).where(
            TestDefinition.slug == payload.test_slug,
            TestDefinition.availability_status == "published",
        )
    )
    if not test or not _age_group_allows(test, user.age_group):
        raise HTTPException(status_code=404, detail="Test is unavailable")
    questionnaire = await db.scalar(select(Questionnaire).where(Questionnaire.test_id == test.id))
    passport = await db.scalar(select(MethodologyPassport).where(MethodologyPassport.test_id == test.id))
    is_engine = test.slug in ENGINE_SLUGS
    if not passport or (not questionnaire and not is_engine):
        raise HTTPException(status_code=409, detail="Test has no questionnaire definition")
    if questionnaire:
        try:
            definition_snapshot = _definition_snapshot(questionnaire)
        except ValueError as exc:
            raise HTTPException(
                status_code=409, detail=f"Questionnaire definition is invalid: {exc}"
            ) from exc
        definition_version = questionnaire.definition_version
    else:
        definition_snapshot = {"questions": [], "branching_rules": [], "scoring": {}}
        definition_version = ENGINE_DEFINITION_VERSION

    definition_snapshot["result_context"] = _result_context(test, passport)

    # Fresh task variant for this attempt; answers stay in the private half of the snapshot.
    definition_snapshot["challenge"] = generate_challenge(test.slug)

    attempt = TestAttempt(
        user_id=user.id,
        test_id=test.id,
        definition_version=definition_version,
        definition_snapshot=definition_snapshot,
        questionnaire_version=definition_version,
        snapshot=definition_snapshot,
        answers={},
        current_question_id=definition_snapshot["questions"][0]["id"]
        if definition_snapshot.get("questions")
        else None,
        expires_at=datetime.now(UTC) + timedelta(hours=settings.attempt_temporary_hours),
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return _state_output(attempt)


@router.get("/{attempt_id}/current", response_model=AttemptStateOutput)
async def get_current_question(
    attempt_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptStateOutput:
    attempt = await _load_attempt(db, attempt_id, user)
    return _state_output(attempt)


@router.get("/{attempt_id}/resume", response_model=AttemptStateOutput)
async def resume_attempt(
    attempt_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptStateOutput:
    attempt = await _load_attempt(db, attempt_id, user)
    return _state_output(attempt)


@router.post("/{attempt_id}/answer", response_model=AttemptStateOutput)
async def submit_answer(
    attempt_id: str,
    payload: AnswerInput,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptStateOutput:
    attempt = await _load_attempt(db, attempt_id, user)
    _require_in_progress(attempt)
    if payload.question_id != attempt.current_question_id:
        raise HTTPException(status_code=409, detail="Answer must be for the current question")
    current_question = next(
        (
            question
            for question in attempt.definition_snapshot.get("questions", [])
            if question["id"] == attempt.current_question_id
        ),
        None,
    )
    if current_question:
        option_ids = {option["id"] for option in current_question.get("options", [])}
        if option_ids and payload.answer not in option_ids:
            raise HTTPException(
                status_code=422, detail="Answer is not an option for the current question"
            )

    answers = dict(attempt.answers)
    answers[payload.question_id] = payload.answer
    attempt.answers = answers
    attempt.current_question_id = _next_question_id(attempt, payload.answer)
    await db.commit()
    await db.refresh(attempt)
    return _state_output(attempt)


def _check_telemetry_size(telemetry: dict[str, Any]) -> None:
    if len(json.dumps(telemetry, separators=(",", ":"))) > _MAX_TELEMETRY_BYTES:
        raise HTTPException(status_code=413, detail="Telemetry payload is too large")


def _score_or_422(slug: str, challenge: dict[str, Any], telemetry: dict[str, Any]) -> dict[str, Any]:
    try:
        return score_attempt(slug, challenge, telemetry)
    except TelemetryError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/{attempt_id}/complete", response_model=AttemptCompletionOutput)
async def complete_attempt(
    attempt_id: str,
    payload: AttemptCompleteInput | None = None,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptCompletionOutput:
    telemetry = payload.telemetry if payload else {}
    _check_telemetry_size(telemetry)
    attempt = await _load_attempt(db, attempt_id, user, for_update=True)
    # A second (concurrent or repeated) completion returns the stored result unchanged.
    if attempt.status == "completed":
        return _completion_output(attempt)

    test_slug = attempt.definition_snapshot.get("result_context", {}).get("test_slug", "")
    challenge = attempt.definition_snapshot.get("challenge", {})
    scored = _score_or_422(test_slug, challenge, telemetry)
    scoring_map = attempt.definition_snapshot.get("scoring", {})
    if scoring_map:
        scored["points"] = sum(
            scoring_map.get(q_id, {}).get(str(ans), 0) for q_id, ans in attempt.answers.items()
        )
    # Atomic claim: only the first completion of an in-progress attempt may write the result,
    # on every database (the row lock above additionally serialises PostgreSQL sessions).
    claimed = await db.execute(
        update(TestAttempt)
        .where(TestAttempt.id == attempt.id, TestAttempt.status == "in_progress")
        .values(status="completed", completed_at=datetime.now(UTC), result=scored)
    )
    await db.commit()
    await db.refresh(attempt)
    if claimed.rowcount == 0:
        # Lost the race: another request completed it first; return its stored result.
        return _completion_output(attempt)
    return _completion_output(attempt)


@router.delete("/{attempt_id}/discard", status_code=status.HTTP_204_NO_CONTENT)
async def discard_attempt(
    attempt_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> None:
    attempt = await _load_attempt(db, attempt_id, user)
    _require_in_progress(attempt)
    await db.delete(attempt)
    await db.commit()


# ------------------------------------------------------------------ guests: stateless attempts


class GuestStartOutput(BaseModel):
    token: str
    challenge: dict[str, Any]
    expires_at: str


class GuestCompleteInput(BaseModel):
    token: str = Field(min_length=20, max_length=200_000)
    telemetry: dict[str, Any] = Field(default_factory=dict)


class GuestCompleteOutput(BaseModel):
    test_slug: str
    result: dict[str, Any]
    completed_at: str


@guest_router.post("/start", response_model=GuestStartOutput)
async def start_guest_attempt(
    payload: AttemptStartInput,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> GuestStartOutput:
    """Try an exercise without an account.  Nothing is stored; the signed token carries the task."""
    enforce_auth_rate_limit(request, "guest-attempt", "start", limit=40)
    test = await db.scalar(
        select(TestDefinition).where(
            TestDefinition.slug == payload.test_slug,
            TestDefinition.availability_status == "published",
            TestDefinition.guest_allowed.is_(True),
        )
    )
    if not test or test.slug not in ENGINE_SLUGS:
        raise HTTPException(status_code=404, detail="Test is unavailable")
    challenge = generate_challenge(test.slug)
    expires = datetime.now(UTC) + timedelta(hours=2)
    token = jwt.encode(
        {"typ": _GUEST_TOKEN_TYPE, "slug": test.slug, "challenge": challenge, "exp": expires},
        settings.jwt_secret.get_secret_value(),
        algorithm="HS256",
    )
    return GuestStartOutput(
        token=token, challenge=challenge["public"], expires_at=expires.isoformat()
    )


@guest_router.post("/complete", response_model=GuestCompleteOutput)
async def complete_guest_attempt(
    payload: GuestCompleteInput,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> GuestCompleteOutput:
    enforce_auth_rate_limit(request, "guest-attempt", "complete", limit=40)
    _check_telemetry_size(payload.telemetry)
    try:
        claims = jwt.decode(
            payload.token, settings.jwt_secret.get_secret_value(), algorithms=["HS256"]
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=410, detail="The attempt has expired") from exc
    if claims.get("typ") != _GUEST_TOKEN_TYPE or claims.get("slug") not in ENGINE_SLUGS:
        raise HTTPException(status_code=400, detail="Invalid attempt token")
    result = _score_or_422(claims["slug"], claims["challenge"], payload.telemetry)
    return GuestCompleteOutput(
        test_slug=claims["slug"], result=result, completed_at=datetime.now(UTC).isoformat()
    )

