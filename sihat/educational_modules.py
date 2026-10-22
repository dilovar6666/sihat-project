"""Original, non-diagnostic exercise definitions for the Stage 4 engine."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.models import MethodologyPassport, Questionnaire, TestDefinition

EDUCATIONAL_SLUGS = (
    "contrast-sensitivity",
    "color-hue-discrimination",
    "visual-perception",
    "sound-discrimination",
    "speech-in-noise",
    "short-term-memory",
    "visual-memory",
    "attention-concentration",
    "attention-switching",
    "emotional-wellbeing",
    "reaction-speed",
    "mouse-eye-coordination",
    "information-processing-speed",
    "physical-wellbeing",
    "daily-activity",
)


def _question(slug: str) -> dict:
    return {
        "id": "exercise-response",
        "type": "choice",
        "required": True,
        "localizations": {
            "ru": {"text": f"Выполните задание: {slug}."},
            "tg": {"text": f"Машқро иҷро кунед: {slug}."},
            "en": {"text": f"Complete the exercise: {slug}."},
        },
        "options": [
            {"id": "completed", "localizations": {"en": {"label": "Completed"}}},
            {"id": "skipped", "localizations": {"en": {"label": "Skipped"}}},
        ],
        "points": {"completed": 1, "skipped": 0},
    }


def install_educational_modules(db: Session) -> int:
    changed = 0
    for slug in EDUCATIONAL_SLUGS:
        test = db.scalar(select(TestDefinition).where(TestDefinition.slug == slug))
        if not test:
            continue
        passport = db.scalar(
            select(MethodologyPassport).where(MethodologyPassport.test_id == test.id)
        )
        if passport:
            passport.evidence_status = "educational"
            passport.limitations = "Reports exercise performance only; it is not a diagnosis."
        questionnaire = db.scalar(select(Questionnaire).where(Questionnaire.test_id == test.id))
        if not questionnaire:
            questionnaire = Questionnaire(
                test_id=test.id,
                definition_version="educational-v1",
                questions=[_question(slug)],
                scoring_config={"metric": "completed_steps"},
                is_published=True,
            )
            db.add(questionnaire)
        test.test_type = "educational_exercise"
        test.availability_status = "published"
        test.guest_allowed = False
        changed += 1
    db.commit()
    return changed
