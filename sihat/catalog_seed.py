from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.models import Category, MethodologyPassport, TestDefinition

CATALOG: tuple[tuple[str, str, str, str, tuple[str, ...]], ...] = (
    (
        "vision",
        "Зрение",
        "Биноӣ",
        "Vision",
        (
            "color-perception",
            "contrast-sensitivity",
            "color-hue-discrimination",
            "visual-perception",
        ),
    ),
    ("hearing", "Слух", "Шунавоӣ", "Hearing", ("sound-discrimination", "speech-in-noise")),
    (
        "memory-attention",
        "Память и внимание",
        "Хотира ва диққат",
        "Memory and attention",
        ("short-term-memory", "visual-memory", "attention-concentration", "attention-switching"),
    ),
    (
        "phobias",
        "Фобии",
        "Фобияҳо",
        "Phobias",
        ("claustrophobia", "acrophobia", "arachnophobia", "social-anxiety", "public-speaking-fear"),
    ),
    (
        "mental-wellbeing",
        "Психологическое состояние",
        "Ҳолати равонӣ",
        "Mental wellbeing",
        ("anxiety", "stress", "mood", "emotional-wellbeing"),
    ),
    ("sleep", "Сон", "Хоб", "Sleep", ("sleep-quality", "daytime-sleepiness")),
    (
        "cognitive-skills",
        "Когнитивные навыки",
        "Малакаҳои маърифатӣ",
        "Cognitive skills",
        ("reaction-speed", "mouse-eye-coordination", "information-processing-speed"),
    ),
    (
        "symptoms",
        "Симптомы",
        "Аломатҳо",
        "Symptoms",
        ("headache", "fatigue", "cough-breathing", "abdominal-pain"),
    ),
    (
        "general-wellbeing",
        "Общее самочувствие",
        "Беҳбудии умумӣ",
        "General wellbeing",
        ("physical-wellbeing", "daily-activity"),
    ),
    ("children", "Детский раздел", "Бахши кӯдакон", "Children", ()),
)


def _localizations(ru: str, tg: str, en: str) -> dict[str, dict[str, str]]:
    return {
        "ru": {"title": ru, "description": "Требует проверки методики перед публикацией."},
        "tg": {"title": tg, "description": "Пеш аз нашр санҷиши методика лозим аст."},
        "en": {"title": en, "description": "Requires methodology review before publication."},
    }


def seed_catalog(db: Session) -> tuple[int, int]:
    created_categories = 0
    created_tests = 0
    for order, (slug, ru, tg, en, tests) in enumerate(CATALOG, start=1):
        category = db.scalar(select(Category).where(Category.slug == slug))
        if not category:
            category = Category(
                slug=slug, localizations=_localizations(ru, tg, en), sort_order=order
            )
            db.add(category)
            db.flush()
            created_categories += 1
        for test_slug in tests:
            if db.scalar(select(TestDefinition.id).where(TestDefinition.slug == test_slug)):
                continue
            test = TestDefinition(
                category_id=category.id,
                slug=test_slug,
                test_type="symptom_questionnaire" if slug == "symptoms" else "educational_exercise",
                localizations=_localizations(
                    test_slug.replace("-", " ").title(),
                    test_slug,
                    test_slug.replace("-", " ").title(),
                ),
            )
            db.add(test)
            db.flush()
            db.add(
                MethodologyPassport(
                    test_id=test.id,
                    methodology_name=test_slug,
                    methodology_version="unreviewed",
                    evidence_status="pending_review",
                    limitations="Not available until evidence and licensing are reviewed.",
                )
            )
            created_tests += 1
    db.commit()
    return created_categories, created_tests
