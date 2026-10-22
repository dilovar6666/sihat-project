"""Authenticated, temporary questionnaire attempts with declarative navigation only."""

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.attempt_schemas import (
    AnswerInput,
    AttemptCompletionOutput,
    AttemptStartInput,
    AttemptStateOutput,
)
from sihat.auth import get_current_user
from sihat.config import Settings, get_settings
from sihat.db import get_db_session
from sihat.models import MethodologyPassport, Questionnaire, TestAttempt, TestDefinition, User
from sihat.security import is_expired

router = APIRouter(prefix="/attempts", tags=["attempts"])
_MISSING = object()


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
    public = {
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
            points = question.get("points", {})
            if isinstance(points, dict):
                scoring[question["id"]] = {
                    str(answer): float(value)
                    for answer, value in points.items()
                    if isinstance(value, int | float)
                }
    return {
        "questions": questions,
        "branching_rules": questionnaire.branching_rules,
        "scoring": scoring,
    }


def _state_output(attempt: TestAttempt) -> AttemptStateOutput:
    questions = attempt.definition_snapshot["questions"]
    current_question = next(
        (question for question in questions if question["id"] == attempt.current_question_id), None
    )
    return AttemptStateOutput(
        id=attempt.id,
        status=attempt.status,
        definition_version=attempt.definition_version,
        current_question=current_question,
        expires_at=attempt.expires_at.isoformat(),
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


def _load_attempt(db: Session, attempt_id: str, user: User) -> TestAttempt:
    attempt = db.get(TestAttempt, attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(status_code=404, detail="Attempt was not found")
    if is_expired(attempt.expires_at):
        db.delete(attempt)
        db.commit()
        raise HTTPException(status_code=410, detail="Attempt has expired")
    return attempt


def _require_in_progress(attempt: TestAttempt) -> None:
    if attempt.status != "in_progress":
        raise HTTPException(status_code=409, detail="Attempt is already complete")


def _next_question_id(attempt: TestAttempt, answer: object) -> str | None:
    current_question_id = attempt.current_question_id
    for rule in attempt.definition_snapshot["branching_rules"]:
        question_id, expected, next_question_id = _branch_rule(rule)
        if question_id == current_question_id and answer == expected:
            return next_question_id
    questions = attempt.definition_snapshot["questions"]
    current_index = next(
        index for index, question in enumerate(questions) if question["id"] == current_question_id
    )
    if current_index + 1 == len(questions):
        return None
    return questions[current_index + 1]["id"]


@router.post("/start", response_model=AttemptStateOutput, status_code=status.HTTP_201_CREATED)
def start_attempt(
    payload: AttemptStartInput,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AttemptStateOutput:
    test = db.scalar(
        select(TestDefinition).where(
            TestDefinition.slug == payload.test_slug,
            TestDefinition.availability_status == "published",
        )
    )
    if not test or not _age_group_allows(test, user.age_group):
        raise HTTPException(status_code=404, detail="Test is unavailable")
    questionnaire = db.scalar(select(Questionnaire).where(Questionnaire.test_id == test.id))
    passport = db.scalar(select(MethodologyPassport).where(MethodologyPassport.test_id == test.id))
    if not questionnaire or not passport:
        raise HTTPException(status_code=409, detail="Test has no questionnaire definition")
    try:
        definition_snapshot = _definition_snapshot(questionnaire)
    except ValueError as exc:
        raise HTTPException(
            status_code=409, detail=f"Questionnaire definition is invalid: {exc}"
        ) from exc

    definition_snapshot["result_context"] = {
        "test_slug": test.slug,
        "test_type": test.test_type,
        "test_title": str(test.localizations.get("en", {}).get("title", test.slug)),
        "methodology_name": passport.methodology_name,
        "methodology_version": passport.methodology_version,
        "compatibility_conditions": {"device_conditions": list(passport.device_conditions)},
        "limitations": passport.limitations,
        "warnings": list(passport.warnings),
    }
    attempt = TestAttempt(
        user_id=user.id,
        test_id=test.id,
        definition_version=questionnaire.definition_version,
        definition_snapshot=definition_snapshot,
        questionnaire_version=questionnaire.definition_version,
        snapshot=definition_snapshot,
        answers={},
        current_question_id=definition_snapshot["questions"][0]["id"],
        expires_at=datetime.now(UTC) + timedelta(hours=settings.attempt_temporary_hours),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return _state_output(attempt)


@router.get("/{attempt_id}/current", response_model=AttemptStateOutput)
def get_current_question(
    attempt_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptStateOutput:
    return _state_output(_load_attempt(db, attempt_id, user))


@router.get("/{attempt_id}/resume", response_model=AttemptStateOutput)
def resume_attempt(
    attempt_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptStateOutput:
    return _state_output(_load_attempt(db, attempt_id, user))


@router.post("/{attempt_id}/answer", response_model=AttemptStateOutput)
def submit_answer(
    attempt_id: str,
    payload: AnswerInput,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptStateOutput:
    attempt = _load_attempt(db, attempt_id, user)
    _require_in_progress(attempt)
    if payload.question_id != attempt.current_question_id:
        raise HTTPException(status_code=409, detail="Answer must be for the current question")
    current_question = next(
        question
        for question in attempt.definition_snapshot["questions"]
        if question["id"] == attempt.current_question_id
    )
    option_ids = {option["id"] for option in current_question.get("options", [])}
    if option_ids and payload.answer not in option_ids:
        raise HTTPException(
            status_code=422, detail="Answer is not an option for the current question"
        )

    answers = dict(attempt.answers)
    answers[payload.question_id] = payload.answer
    attempt.answers = answers
    attempt.current_question_id = _next_question_id(attempt, payload.answer)
    db.commit()
    db.refresh(attempt)
    return _state_output(attempt)


@router.post("/{attempt_id}/complete", response_model=AttemptCompletionOutput)
def complete_attempt(
    attempt_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> AttemptCompletionOutput:
    attempt = _load_attempt(db, attempt_id, user)
    if attempt.status == "completed":
        return _completion_output(attempt)
    if attempt.current_question_id is not None:
        raise HTTPException(status_code=409, detail="Attempt has unanswered questions")
    attempt.status = "completed"
    attempt.completed_at = datetime.now(UTC)
    score = sum(
        attempt.definition_snapshot.get("scoring", {}).get(question_id, {}).get(str(answer), 0)
        for question_id, answer in attempt.answers.items()
    )
    attempt.result = {"score": score, "message": "Exercise result only; it is not a diagnosis."}
    db.commit()
    db.refresh(attempt)
    return _completion_output(attempt)


@router.delete("/{attempt_id}/discard", status_code=status.HTTP_204_NO_CONTENT)
def discard_attempt(
    attempt_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> None:
    attempt = _load_attempt(db, attempt_id, user)
    _require_in_progress(attempt)
    db.delete(attempt)
    db.commit()
