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


MODULE_METRICS = {
    "contrast-sensitivity": "contrast_choices_correct",
    "color-hue-discrimination": "hue_choices_correct",
    "visual-perception": "shape_matches_correct",
    "sound-discrimination": "sound_choices_correct",
    "speech-in-noise": "speech_choices_correct",
    "short-term-memory": "sequence_items_recalled",
    "visual-memory": "visual_items_recalled",
    "attention-concentration": "targets_matched",
    "attention-switching": "rule_switches_correct",
    "emotional-wellbeing": "reflection_completed",
    "reaction-speed": "reaction_time_ms",
    "mouse-eye-coordination": "pointer_accuracy",
    "information-processing-speed": "items_processed",
    "physical-wellbeing": "reflection_completed",
    "daily-activity": "reflection_completed",
}


def _question(slug: str) -> dict:
    metric = MODULE_METRICS[slug]
    return {
        "id": f"{slug}-response",
        "type": "choice",
        "required": True,
        "localizations": {
            "ru": {"text": f"Выполните упражнение «{slug}» и выберите результат."},
            "tg": {"text": f"Машқи «{slug}»-ро иҷро карда, натиҷаро интихоб кунед."},
            "en": {"text": f"Complete the {slug} exercise and select its outcome."},
        },
        "options": [
            {"id": "completed", "localizations": {"en": {"label": "Completed"}}},
            {"id": "skipped", "localizations": {"en": {"label": "Skipped"}}},
        ],
        "points": {"completed": 1, "skipped": 0},
        "metric": metric,
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
                scoring_config={"metric": MODULE_METRICS[slug], "result_type": "exercise_performance"},
                is_published=True,
            )
            db.add(questionnaire)
        test.test_type = "educational_exercise"
        test.availability_status = "published"
        test.guest_allowed = False
        changed += 1
    db.commit()
    return changed
