"""Catalogue of the approved interactive exercises (idempotent database synchronisation).

The catalogue is data, not code paths: :func:`sync_engine_catalog` creates or refreshes the
categories, test definitions and methodology passports of the exercises implemented in
:mod:`sihat.test_generators`.  It never deletes rows, so users' saved history is untouched;
tests that are not in the approved list are only *hidden* (``draft``).
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.models import Category, MethodologyPassport, TestDefinition
from sihat.test_generators import ENGINE_SLUGS

PASSPORT_VERSION = "2.0"
COMMON_LIMITATIONS = (
    "Educational self-observation exercise. It is not a medical device, does not diagnose "
    "any condition and does not replace a specialist. Results depend on the device, input "
    "method, screen, sound output and your state at the moment of the attempt."
)
COMMON_INTERPRETATION = (
    "No population norms or clinical cut-offs are applied. Compare results only with your "
    "own earlier attempts made under similar conditions."
)

CATEGORIES: tuple[tuple[str, int, dict[str, str]], ...] = (
    ("memory-attention", 1, {"ru": "Внимание и память", "tg": "Диққат ва хотира", "en": "Attention and memory"}),
    ("vision", 2, {"ru": "Зрительное восприятие", "tg": "Идроки визуалӣ", "en": "Visual perception"}),
    ("hearing", 3, {"ru": "Слух", "tg": "Шунавоӣ", "en": "Hearing"}),
    ("reaction-coordination", 4, {"ru": "Реакция и координация", "tg": "Вокуниш ва ҳамоҳангӣ", "en": "Reaction and coordination"}),
)  # fmt: skip

# slug -> (category, titles, descriptions, passport)
CATALOG: dict[str, dict[str, Any]] = {
    "attention-concentration": {
        "category": "memory-attention",
        "title": {"ru": "Таблицы Шульте", "tg": "Ҷадвалҳои Шулте", "en": "Schulte Tables"},
        "description": {
            "ru": "Найдите числа от 1 до 25 по порядку. Расстановка каждый раз новая.",
            "tg": "Рақамҳоро аз 1 то 25 ба тартиб ёбед. Ҷойгиркунӣ ҳар дафъа нав аст.",
            "en": "Find the numbers 1 to 25 in order. The layout is new every time.",
        },
        "passport": {
            "name": "Schulte table (visual search)",
            "source": "Classic Schulte table paradigm, implemented as a digital educational exercise.",
            "devices": ["Mouse or touch screen", "Screen at least 5 inches"],
            "scoring": "Total time to click 1-25 in order; wrong clicks are counted as errors; the two halves of the run are compared.",
        },
    },
    "attention-switching": {
        "category": "memory-attention",
        "title": {"ru": "Переключение внимания", "tg": "Гузариши диққат", "en": "Attention Switching"},
        "description": {
            "ru": "Соединяйте точки по порядку: сначала числа, затем чередуя числа и буквы.",
            "tg": "Нуқтаҳоро ба тартиб пайваст кунед: аввал рақамҳо, баъд рақам ва ҳарфро иваз карда.",
            "en": "Connect dots in order: first numbers, then alternating numbers and letters.",
        },
        "passport": {
            "name": "Trail-making style switching exercise",
            "source": "Digital exercise inspired by the trail-making paradigm; not the clinical Trail Making Test.",
            "devices": ["Mouse or touch screen"],
            "scoring": "Time for part A (numbers) and part B (numbers and letters); switching cost = time B minus time A; wrong taps are errors.",
        },
    },
    "visual-memory": {
        "category": "memory-attention",
        "title": {"ru": "Блоки Корси", "tg": "Блокҳои Корси", "en": "Corsi Blocks"},
        "description": {
            "ru": "Запомните порядок подсвеченных блоков и повторите его.",
            "tg": "Тартиби блокҳои равшаншударо ба ёд гирифта, такрор кунед.",
            "en": "Remember the order of highlighted blocks and repeat it.",
        },
        "passport": {
            "name": "Corsi block-tapping style exercise",
            "source": "Digital exercise based on the block-tapping paradigm; not a clinical instrument.",
            "devices": ["Mouse or touch screen"],
            "scoring": "Sequences grow from 3 to 9 blocks, two per length; the exercise stops after both trials of a length fail. Span = longest length passed.",
        },
    },
    "short-term-memory": {
        "category": "memory-attention",
        "title": {"ru": "Память на цифры", "tg": "Хотира барои рақамҳо", "en": "Digit Span"},
        "description": {
            "ru": "Запомните ряд цифр и повторите его в прямом и обратном порядке.",
            "tg": "Қатори рақамҳоро ба ёд гирифта, ба тартиби рост ва баръакс такрор кунед.",
            "en": "Remember a series of digits and repeat it forwards and backwards.",
        },
        "passport": {
            "name": "Digit span (forward and backward)",
            "source": "Classic digit-span paradigm, implemented as a digital educational exercise.",
            "devices": ["Keyboard or touch screen"],
            "scoring": "Series grow in length, two per length; stops after both trials of a length fail. Forward and backward span are reported separately.",
        },
    },
    "information-processing-speed": {
        "category": "memory-attention",
        "title": {"ru": "Символы и числа", "tg": "Рамзҳо ва рақамҳо", "en": "Symbols and Numbers"},
        "description": {
            "ru": "По ключу сопоставляйте символы с числами за 90 секунд.",
            "tg": "Аз рӯи калид рамзҳоро бо рақамҳо дар 90 сония мувофиқ кунед.",
            "en": "Match symbols to numbers using a key for 90 seconds.",
        },
        "passport": {
            "name": "Symbol-digit substitution exercise",
            "source": "Digital exercise based on the symbol-digit substitution paradigm; the key is regenerated for every attempt.",
            "devices": ["Keyboard or touch screen"],
            "scoring": "Correct substitutions within 90 seconds, errors, accuracy and speed per minute; progress is shown in 15-second blocks.",
        },
    },
    "contrast-sensitivity": {
        "category": "vision",
        "title": {"ru": "Различение контраста", "tg": "Фарқкунии контраст", "en": "Contrast Discrimination"},
        "description": {
            "ru": "Определите наклон полос при всё более слабом контрасте.",
            "tg": "Моили хатҳоро ҳангоми контрасти торафт заифтар муайян кунед.",
            "en": "Tell the tilt of stripes as the contrast gets fainter.",
        },
        "passport": {
            "name": "Grating tilt discrimination",
            "source": "Digital self-observation exercise using tilted gratings; display is not calibrated.",
            "devices": ["Screen at normal brightness", "Stable lighting", "Viewing distance about an arm's length"],
            "scoring": "Ten contrast levels from 60% to 2.5%, two trials each; stops when both trials at a level are wrong. Threshold = faintest level answered correctly twice.",
        },
    },
    "color-perception": {
        "category": "vision",
        "title": {"ru": "Тест на дальтонизм", "tg": "Санҷиши дальтонизм", "en": "Color Blindness Screening"},
        "description": {
            "ru": "Скрининг цветовосприятия по полихроматическим таблицам Рабкина и Ишихары (оценка красно-зелёного и сине-жёлтого спектров).",
            "tg": "Скрининги идроки рангҳо бо ҷадвалҳои полихроматии Рабкин ва Ишиҳара (арзёбии спектри сурху сабз ва кабуду зард).",
            "en": "Pseudoisochromatic plate screening for red-green and blue-yellow color vision discrimination (Rabkin and Ishihara plates).",
        },
        "passport": {
            "name": "Pseudoisochromatic plates screening (Rabkin / Ishihara)",
            "source": "Educational digital color-discrimination screening based on pseudoisochromatic dot plates (ISO 8596 / CIE chromaticity coordinates). Displays are uncalibrated; for formal diagnosis consult an ophthalmologist.",
            "devices": ["Color display with sRGB coverage", "Normal brightness (avoid night mode / Blue Light filter)", "Well-lit room without screen glare"],
            "scoring": "Eight randomized pseudoisochromatic plates covering baseline calibration, red-green (protan/deutan) and blue-yellow (tritan) channels; total accuracy, error breakdown by cone channel, and cone sensitivity profile.",
        },
    },
    "visual-pairs": {
        "category": "vision",
        "title": {"ru": "Визуальные пары", "tg": "Ҷуфтҳои визуалӣ", "en": "Visual Pairs"},
        "description": {
            "ru": "Найдите все пары одинаковых картинок за наименьшее число ходов.",
            "tg": "Ҳамаи ҷуфтҳои тасвирҳои якхеларо бо камтарин ҳаракат ёбед.",
            "en": "Find all pairs of matching pictures in as few moves as possible.",
        },
        "passport": {
            "name": "Memory pairs exercise",
            "source": "Digital pair-matching game used as an educational visual memory exercise.",
            "devices": ["Mouse or touch screen"],
            "scoring": "Number of moves, mismatches and time; efficiency = 6 pairs divided by moves.",
        },
    },
    "path-memory": {
        "category": "vision",
        "title": {"ru": "Запомни маршрут", "tg": "Масирро ба ёд гир", "en": "Remember the Route"},
        "description": {
            "ru": "Запомните путь по клеткам и повторите его.",
            "tg": "Роҳро аз рӯи катакҳо ба ёд гирифта, такрор кунед.",
            "en": "Remember a path across the cells and repeat it.",
        },
        "passport": {
            "name": "Spatial route memory",
            "source": "Digital spatial memory exercise; routes of 4, 5 and 6 steps are generated for every attempt.",
            "devices": ["Mouse or touch screen"],
            "scoring": "Steps repeated in the correct position and routes reproduced completely.",
        },
    },
    "pattern-matrix": {
        "category": "vision",
        "title": {"ru": "Продолжи последовательность", "tg": "Пайдарпайиро идома деҳ", "en": "Continue the Sequence"},
        "description": {
            "ru": "Выберите фигуру, которая продолжает закономерность.",
            "tg": "Шаклеро интихоб кунед, ки қонуниятро идома медиҳад.",
            "en": "Choose the shape that continues the pattern.",
        },
        "passport": {
            "name": "Visual pattern completion",
            "source": "Digital reasoning exercise with generated rules (cycle, rotation, count, alternation); every item has exactly one correct option.",
            "devices": ["Mouse or touch screen"],
            "scoring": "Six items; correct answers are counted overall and by rule type.",
        },
    },
    "sound-discrimination": {
        "category": "hearing",
        "title": {"ru": "Сравнение звуков", "tg": "Муқоисаи садоҳо", "en": "Sound Comparison"},
        "description": {
            "ru": "Сравните два тона: второй выше, ниже или такой же?",
            "tg": "Ду оҳангро муқоиса кунед: дуюм баландтар, пасттар ё баробар аст?",
            "en": "Compare two tones: is the second higher, lower or the same?",
        },
        "passport": {
            "name": "Pitch comparison",
            "source": "Digital pitch-discrimination exercise; it is not audiometry and does not measure hearing thresholds.",
            "devices": ["Headphones recommended", "Quiet room", "Comfortable volume"],
            "scoring": "14 tone pairs with differences from 9% to 1.2% plus two identical pairs; correct answers overall and by difference size.",
        },
    },
    "speech-in-noise": {
        "category": "hearing",
        "title": {"ru": "Речь среди шума", "tg": "Нутқ дар миёни садо", "en": "Speech in Noise"},
        "description": {
            "ru": "Расслышьте три цифры, произнесённые на фоне шума.",
            "tg": "Се рақамеро, ки дар замина садо хонда мешаванд, бишнавед.",
            "en": "Catch three digits spoken against background noise.",
        },
        "passport": {
            "name": "Digits in noise",
            "source": "Digital digit-triplet exercise using the browser's speech synthesis and generated noise; the noise level is relative, not calibrated in decibels.",
            "devices": ["Headphones recommended", "Browser with speech synthesis", "Quiet room"],
            "scoring": "Ten digit triplets over five relative noise levels; digits in the correct position are counted overall and by noise level.",
        },
    },
    "reaction-speed": {
        "category": "reaction-coordination",
        "title": {"ru": "Простая реакция", "tg": "Вокуниши оддӣ", "en": "Simple Reaction"},
        "description": {
            "ru": "Нажмите, как только экран изменится. Паузы случайные.",
            "tg": "Ҳамин ки экран тағйир ёфт, пахш кунед. Танаффусҳо тасодуфианд.",
            "en": "Press as soon as the screen changes. Waiting times are random.",
        },
        "passport": {
            "name": "Simple reaction time",
            "source": "Digital reaction time exercise; browser and display latency are not compensated.",
            "devices": ["Mouse, touch screen or keyboard"],
            "scoring": "Eight trials with random waits; mean, median, best, slowest, variability, anticipations (<100 ms or early press) and lapses (>500 ms).",
        },
    },
    "go-no-go": {
        "category": "reaction-coordination",
        "title": {"ru": "Go / No-Go", "tg": "Go / No-Go", "en": "Go / No-Go"},
        "description": {
            "ru": "Нажимайте на зелёный сигнал и не нажимайте на красный.",
            "tg": "Ба сигнали сабз пахш кунед, ба сурх пахш накунед.",
            "en": "Press for the green signal and hold back for the red one.",
        },
        "passport": {
            "name": "Go / No-Go response inhibition",
            "source": "Digital go/no-go exercise: 40 signals, 75% go and 25% no-go in a generated order.",
            "devices": ["Mouse, touch screen or keyboard"],
            "scoring": "Hits, omissions, commission errors, correct rejections, mean reaction time and errors by quarter of the run.",
        },
    },
    "mouse-eye-coordination": {
        "category": "reaction-coordination",
        "title": {"ru": "Слежение за целью", "tg": "Пайгирии ҳадаф", "en": "Target Tracking"},
        "description": {
            "ru": "Удерживайте курсор на движущейся цели 20 секунд.",
            "tg": "Курсорро 20 сония дар болои ҳадафи ҳаракаткунанда нигоҳ доред.",
            "en": "Keep the cursor on a moving target for 20 seconds.",
        },
        "passport": {
            "name": "Pursuit tracking",
            "source": "Digital pursuit-tracking exercise; the target path is generated for every attempt and the cursor path is recomputed on the server.",
            "devices": ["Mouse, trackpad or touch screen"],
            "scoring": "Share of time on target, root-mean-square deviation and mean deviation (as a percentage of the arena height).",
        },
    },
    "cursor-path": {
        "category": "reaction-coordination",
        "title": {"ru": "Точный маршрут курсора", "tg": "Масири дақиқи курсор", "en": "Precise Cursor Path"},
        "description": {
            "ru": "Проведите курсор по извилистому коридору, не касаясь границ.",
            "tg": "Курсорро аз долони каҷу килеб бе расидан ба ҳошияҳо гузаронед.",
            "en": "Guide the cursor along a winding corridor without touching the edges.",
        },
        "passport": {
            "name": "Steering through a corridor",
            "source": "Digital steering exercise; a new corridor is generated for every attempt.",
            "devices": ["Mouse, trackpad or touch screen"],
            "scoring": "Completion time, share of time inside the corridor, number of exits and mean deviation from the centre line.",
        },
    },
}

assert set(CATALOG) == set(ENGINE_SLUGS)


def _localizations(item: dict[str, Any]) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    for lang in ("ru", "tg", "en"):
        out[lang] = {"title": item["title"][lang], "description": item["description"][lang]}
    out["tj"] = dict(out["tg"])
    return out


def sync_engine_catalog(db: Session, *, hide_unapproved: bool = False) -> dict[str, list[str]]:
    """Create/refresh approved exercises.  Returns which slugs were created and hidden."""
    created: list[str] = []
    hidden: list[str] = []
    categories: dict[str, Category] = {}
    for slug, order, titles in CATEGORIES:
        category = db.scalar(select(Category).where(Category.slug == slug))
        if category is None:
            category = Category(slug=slug, localizations={}, sort_order=order)
            db.add(category)
        category.localizations = {
            "ru": {"title": titles["ru"]},
            "tg": {"title": titles["tg"]},
            "tj": {"title": titles["tg"]},
            "en": {"title": titles["en"]},
        }
        category.sort_order = order
        category.is_active = True
        categories[slug] = category
    db.flush()

    for slug, item in CATALOG.items():
        test = db.scalar(select(TestDefinition).where(TestDefinition.slug == slug))
        if test is None:
            test = TestDefinition(
                slug=slug,
                category_id=categories[item["category"]].id,
                test_type="educational_exercise",
            )
            db.add(test)
            created.append(slug)
        test.category_id = categories[item["category"]].id
        test.test_type = "educational_exercise"
        test.availability_status = "published"
        test.guest_allowed = True
        test.min_age = 16
        test.max_age = None
        test.localizations = _localizations(item)
        test.test_engine_key = slug
        db.flush()

        spec = item["passport"]
        passport = db.scalar(
            select(MethodologyPassport).where(MethodologyPassport.test_id == test.id)
        )
        if passport is None:
            passport = MethodologyPassport(test_id=test.id, methodology_name="", limitations="")
            db.add(passport)
        passport.methodology_name = spec["name"]
        passport.methodology_version = PASSPORT_VERSION
        passport.evidence_status = "educational"
        passport.evidence_source = spec["source"]
        passport.license_info = "SIHAT original implementation; no third-party test material is used."
        passport.allowed_languages = ["ru", "tg", "en"]
        passport.device_conditions = spec["devices"]
        passport.scoring_summary = spec["scoring"]
        passport.interpretation_summary = COMMON_INTERPRETATION
        passport.limitations = COMMON_LIMITATIONS
        passport.warnings = [
            "Not a diagnosis and not medical advice.",
            "Stop if you feel unwell, dizzy or uncomfortable.",
        ]
    db.flush()

    if hide_unapproved:
        others = db.scalars(
            select(TestDefinition).where(
                TestDefinition.slug.not_in(ENGINE_SLUGS),
                TestDefinition.availability_status == "published",
            )
        ).all()
        for test in others:
            test.availability_status = "draft"
            hidden.append(test.slug)

    published_categories = {
        row
        for row in db.scalars(
            select(TestDefinition.category_id).where(TestDefinition.availability_status == "published")
        ).all()
    }
    for category in db.scalars(select(Category)).all():
        category.is_active = category.id in published_categories
    db.flush()
    return {"created": created, "hidden": hidden}
