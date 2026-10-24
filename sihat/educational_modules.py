"""Educational exercise definitions, localized catalog setup, and safe module retirement for SIHAT."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.models import Category, MethodologyPassport, Questionnaire, TestDefinition

APPROVED_MODULES = [
    {
        "slug": "attention-concentration",
        "category_slug": "memory-attention",
        "metric": "work_efficiency_er",
        "localizations": {
            "ru": {"title": "Таблицы Шульте (5 × 5)", "description": "Концентрация, устойчивость и избирательность зрительного внимания."},
            "tg": {"title": "Ҷадвалҳои Шульте (5 × 5)", "description": "Тамаркуз ва устувории диққати биноӣ."},
            "tj": {"title": "Ҷадвалҳои Шульте (5 × 5)", "description": "Тамаркуз ва устувории диққати биноӣ."},
            "en": {"title": "Schulte Tables (5 × 5)", "description": "Concentration, endurance, and selective visual attention."},
        },
    },
    {
        "slug": "attention-switching",
        "category_slug": "memory-attention",
        "metric": "switching_cost_ms",
        "localizations": {
            "ru": {"title": "Переключение внимания (1-A-2-B...)", "description": "Когнитивная гибкость и исполнительный контроль переключения между рядами."},
            "tg": {"title": "Гузариши диққат (1-A-2-B...)", "description": "Чассирии маърифатӣ ва назорати иҷроияи гузариш."},
            "tj": {"title": "Гузариши диққат (1-A-2-B...)", "description": "Чассирии маърифатӣ ва назорати иҷроияи гузариш."},
            "en": {"title": "Attention Switching (1-A-2-B...)", "description": "Cognitive flexibility and executive alternate sequence tracking."},
        },
    },
    {
        "slug": "visual-memory",
        "category_slug": "memory-attention",
        "metric": "max_spatial_span",
        "localizations": {
            "ru": {"title": "Пространственная память (Блоки Корси)", "description": "Воспроизведение последовательности блоков в пространстве."},
            "tg": {"title": "Хотираи фазоӣ (Блокҳои Корси)", "description": "Такрори пайдарпайии блокҳо дар фазо."},
            "tj": {"title": "Хотираи фазоӣ (Блокҳои Корси)", "description": "Такрори пайдарпайии блокҳо дар фазо."},
            "en": {"title": "Spatial Memory (Corsi Blocks)", "description": "Visuospatial working memory block sequence span."},
        },
    },
    {
        "slug": "short-term-memory",
        "category_slug": "memory-attention",
        "metric": "digit_span_recalled",
        "localizations": {
            "ru": {"title": "Память на цифры", "description": "Кратковременное слухоречевое удержание и обратное переструктурирование чисел."},
            "tg": {"title": "Хотираи рақамҳо", "description": "Нигоҳдории кӯтоҳмуддати шунавоӣ ва такрори баръакси рақамҳо."},
            "tj": {"title": "Хотираи рақамҳо", "description": "Нигоҳдории кӯтоҳмуддати шунавоӣ ва такрори баръакси рақамҳо."},
            "en": {"title": "Digit Span Memory", "description": "Auditory-verbal short-term retention and reverse sequence manipulation."},
        },
    },
    {
        "slug": "information-processing-speed",
        "category_slug": "cognitive-skills",
        "metric": "speed_per_minute",
        "localizations": {
            "ru": {"title": "Сопоставление символов и чисел", "description": "Скорость зрительно-моторной обработки и сопоставления по ключу."},
            "tg": {"title": "Мутобиқати рамзҳо ва рақамҳо", "description": "Суръати коркарди биноӣ-моторӣ ва мутобиқат аз рӯи калид."},
            "tj": {"title": "Мутобиқати рамзҳо ва рақамҳо", "description": "Суръати коркарди биноӣ-моторӣ ва мутобиқат аз рӯи калид."},
            "en": {"title": "Symbol-Number Matching", "description": "Visual-motor processing speed and key code substitution."},
        },
    },
    {
        "slug": "contrast-sensitivity",
        "category_slug": "vision",
        "metric": "lowest_detected_contrast_pct",
        "localizations": {
            "ru": {"title": "Различение контраста", "description": "Сенсорное различение слабоконтрастных стимулов на нейтральном фоне."},
            "tg": {"title": "Фарқи контраст", "description": "Фарқкунии ҳассоси стимулҳои ками контраст."},
            "tj": {"title": "Фарқи контраст", "description": "Фарқкунии ҳассоси стимулҳои ками контраст."},
            "en": {"title": "Contrast Discrimination", "description": "Visual sensitivity to low-contrast stimuli against uniform backgrounds."},
        },
    },
    {
        "slug": "visual-pairs",
        "category_slug": "vision",
        "metric": "pairs_found",
        "localizations": {
            "ru": {"title": "Визуальные пары (Парные карточки)", "description": "Кратковременное зрительное удержание и поиск совпадающих карточек."},
            "tg": {"title": "Ҷуфтҳои биноӣ (Кортҳои ҷуфт)", "description": "Нигоҳдории биноӣ ва ҷустуҷӯи кортҳои монанд."},
            "tj": {"title": "Ҷуфтҳои биноӣ (Кортҳои ҷуфт)", "description": "Нигоҳдории биноӣ ва ҷустуҷӯи кортҳои монанд."},
            "en": {"title": "Visual Pairs (Matching Cards)", "description": "Visual short-term retention and matching pairs discovery."},
        },
    },
    {
        "slug": "path-memory",
        "category_slug": "memory-attention",
        "metric": "path_reproduced_steps",
        "localizations": {
            "ru": {"title": "Запомни маршрут", "description": "Запоминание и точное воспроизведение скрытой траектории на сетке."},
            "tg": {"title": "Масирро ба хотир гир", "description": "Ба хотир гирифтан ва такрори хатсайри пинҳон дар шабака."},
            "tj": {"title": "Масирро ба хотир гир", "description": "Ба хотир гирифтан ва такрори хатсайри пинҳон дар шабака."},
            "en": {"title": "Path Memory (Maze Route)", "description": "Recall and reproduction of hidden sequential spatial grid routes."},
        },
    },
    {
        "slug": "pattern-matrix",
        "category_slug": "cognitive-skills",
        "metric": "correct_answers",
        "localizations": {
            "ru": {"title": "Продолжи последовательность", "description": "Аналитическое определение геометрических закономерностей и матричных правил."},
            "tg": {"title": "Пайдарпайиро идома деҳ", "description": "Муайян кардани қонуниятҳои геометрӣ дар матритса."},
            "tj": {"title": "Пайдарпайиро идома деҳ", "description": "Муайян кардани қонуниятҳои геометрӣ дар матритса."},
            "en": {"title": "Pattern Matrix Completion", "description": "Analytical identification of geometric progression rules."},
        },
    },
    {
        "slug": "sound-discrimination",
        "category_slug": "hearing",
        "metric": "sound_choices_correct",
        "localizations": {
            "ru": {"title": "Сравнение звуков", "description": "Сравнение высоты и тональности акустических сигналов."},
            "tg": {"title": "Муқоисаи овозҳо", "description": "Муқоисаи баландии оҳанг ва тонҳои акустикӣ."},
            "tj": {"title": "Муқоисаи овозҳо", "description": "Муқоисаи баландии оҳанг ва тонҳои акустикӣ."},
            "en": {"title": "Sound Comparison", "description": "Pitch and tonal comparison of acoustic frequency pairs."},
        },
    },
    {
        "slug": "speech-in-noise",
        "category_slug": "hearing",
        "metric": "words_identified",
        "localizations": {
            "ru": {"title": "Распознавание речи среди шума", "description": "Семантическое различение ключевых слов в условиях фонового шума."},
            "tg": {"title": "Шинохти нутқ дар садо", "description": "Фарқ кардани калимаҳои муҳим дар шароити садои пасманзар."},
            "tj": {"title": "Шинохти нутқ дар садо", "description": "Фарқ кардани калимаҳои муҳим дар шароити садои пасманзар."},
            "en": {"title": "Speech-in-Noise Recognition", "description": "Auditory speech intelligibility against acoustic background masking."},
        },
    },
    {
        "slug": "reaction-speed",
        "category_slug": "cognitive-skills",
        "metric": "mean_reaction_time_ms",
        "localizations": {
            "ru": {"title": "Простая реакция", "description": "Измерение миллисекундного латентного периода психомоторного ответа."},
            "tg": {"title": "Аксуламали оддӣ", "description": "Андозагирии давраи пинҳонии посухи психомоторӣ бо миллисонияҳо."},
            "tj": {"title": "Аксуламали оддӣ", "description": "Андозагирии давраи пинҳонии посухи психомоторӣ бо миллисонияҳо."},
            "en": {"title": "Simple Reaction Speed", "description": "Millisecond latency of simple motor response after variable foreperiod."},
        },
    },
    {
        "slug": "go-no-go",
        "category_slug": "cognitive-skills",
        "metric": "inhibitory_control_pct",
        "localizations": {
            "ru": {"title": "Реакция Go / No-Go", "description": "Дифференцировка целевых стимулов и торможение импульсивных реакций."},
            "tg": {"title": "Аксуламали Go / No-Go", "description": "Тафриқаи стимулҳо ва боздории аксуламалҳои шитобкорона."},
            "tj": {"title": "Аксуламали Go / No-Go", "description": "Тафриқаи стимулҳо ва боздории аксуламалҳои шитобкорона."},
            "en": {"title": "Go/No-Go Response", "description": "Target discrimination and motor impulse inhibition."},
        },
    },
    {
        "slug": "mouse-eye-coordination",
        "category_slug": "cognitive-skills",
        "metric": "time_on_target_pct",
        "localizations": {
            "ru": {"title": "Слежение за движущейся целью", "description": "Плавная зрительно-моторная координация и непрерывный трекинг."},
            "tg": {"title": "Пайгирии ҳадафи ҳаракаткунанда", "description": "Ҳамоҳангсозии биноӣ-моторӣ ва пайгирии пайваста."},
            "tj": {"title": "Пайгирии ҳадафи ҳаракаткунанда", "description": "Ҳамоҳангсозии биноӣ-моторӣ ва пайгирии пайваста."},
            "en": {"title": "Pursuit Tracking", "description": "Continuous smooth eye-hand motor coordination along dynamic trajectories."},
        },
    },
    {
        "slug": "cursor-path",
        "category_slug": "cognitive-skills",
        "metric": "path_accuracy_pct",
        "localizations": {
            "ru": {"title": "Точный маршрут курсора", "description": "Прецизионный моторный контроль при прохождении узкого коридора."},
            "tg": {"title": "Масири дақиқи нишондиҳанда", "description": "Назорати дақиқи моторӣ ҳангоми гузаштан аз долони танг."},
            "tj": {"title": "Масири дақиқи нишондиҳанда", "description": "Назорати дақиқи моторӣ ҳангоми гузаштан аз долони танг."},
            "en": {"title": "Cursor Steering Path", "description": "Fine motor steering and boundary adherence through curved paths."},
        },
    },
    {
        "slug": "anxiety",
        "category_slug": "mental-wellbeing",
        "metric": "gad7_score",
        "localizations": {
            "ru": {"title": "Шкала тревожности GAD-7", "description": "Стандартизированная доказательная самооценка эмоционального фона за 14 дней."},
            "tg": {"title": "Ҷадвали изтироби GAD-7", "description": "Худбаҳодиҳии стандартии ҳолати эмотсионалӣ дар 14 рӯзи охир."},
            "tj": {"title": "Ҷадвали изтироби GAD-7", "description": "Худбаҳодиҳии стандартии ҳолати эмотсионалӣ дар 14 рӯзи охир."},
            "en": {"title": "GAD-7 Anxiety Scale", "description": "Standardized evidence-based self-assessment of anxiety over past 14 days."},
        },
    },
]

EXCLUDED_SLUGS = (
    "visual-perception",
    "color-hue-discrimination",
    "headache",
    "fatigue",
    "cough-breathing",
    "abdominal-pain",
    "sleep-quality",
    "daytime-sleepiness",
    "daily-activity",
    "physical-wellbeing",
    "color-perception",
    "odd-symbol-out",
    "claustrophobia",
    "acrophobia",
    "arachnophobia",
    "social-anxiety",
    "public-speaking-fear",
    "stress",
    "mood",
    "emotional-wellbeing",
)

EDUCATIONAL_SLUGS = tuple(m["slug"] for m in APPROVED_MODULES)
MODULE_METRICS = {m["slug"]: m["metric"] for m in APPROVED_MODULES}


def _question(slug: str, metric: str) -> dict:
    return {
        "id": f"{slug}-response",
        "type": "choice",
        "required": True,
        "localizations": {
            "ru": {"text": f"Выполните упражнение «{slug}» и отправьте телеметрию."},
            "tg": {"text": f"Машқи «{slug}»-ро иҷро карда, натиҷаро фиристед."},
            "tj": {"text": f"Машқи «{slug}»-ро иҷро карда, натиҷаро фиристед."},
            "en": {"text": f"Complete the {slug} exercise and submit telemetry."},
        },
        "options": [
            {"id": "completed", "localizations": {"en": {"label": "Completed"}}},
            {"id": "skipped", "localizations": {"en": {"label": "Skipped"}}},
        ],
        "points": {"completed": 1, "skipped": 0},
        "metric": metric,
    }


def install_educational_modules(db: Session) -> int:
    """Publish only the 16 approved modules and safely retire excluded mechanics to draft."""
    changed = 0

    # 1. Safely unpublish all excluded modules without dropping data or breaking foreign keys
    for ex_slug in EXCLUDED_SLUGS:
        ex_test = db.scalar(select(TestDefinition).where(TestDefinition.slug == ex_slug))
        if ex_test and ex_test.availability_status != "draft":
            ex_test.availability_status = "draft"
            ex_test.guest_allowed = False

    # 2. Ensure all approved modules are present and published
    for mod in APPROVED_MODULES:
        slug = mod["slug"]
        cat_slug = mod["category_slug"]
        cat = db.scalar(select(Category).where(Category.slug == cat_slug))
        if not cat:
            # Fallback to first category
            cat = db.scalar(select(Category).order_by(Category.sort_order))

        test = db.scalar(select(TestDefinition).where(TestDefinition.slug == slug))
        if not test:
            test = TestDefinition(
                category_id=cat.id if cat else "default",
                slug=slug,
                test_type="educational_exercise",
                availability_status="published",
                guest_allowed=True,
                min_age=16,
                localizations=mod["localizations"],
            )
            db.add(test)
            db.flush()
        else:
            test.availability_status = "published"
            test.guest_allowed = True
            test.localizations = mod["localizations"]
            if cat and test.category_id != cat.id:
                test.category_id = cat.id
        changed += 1

        passport = db.scalar(
            select(MethodologyPassport).where(MethodologyPassport.test_id == test.id)
        )
        if not passport:
            passport = MethodologyPassport(
                test_id=test.id,
                methodology_name=mod["localizations"]["ru"]["title"],
                methodology_version="2.5.0",
                evidence_status="educational",
                evidence_source="SIHAT Open Science Protocol & Cognitive Psychophysiology Research",
                limitations="Данный скрининг является интерактивным психофизиологическим упражнением. Он не является клиническим диагнозом и не заменяет очного медицинского осмотра.",
                warnings=["Результаты носят ознакомительный и образовательный характер."],
                device_conditions=["Стабильное рассеянное освещение 300–500 Люкс", "Экран sRGB, комфортное расстояние 50–60 см"],
            )
            db.add(passport)
        else:
            passport.evidence_status = "educational"
            passport.methodology_name = mod["localizations"]["ru"]["title"]
            passport.limitations = "Данный скрининг является интерактивным психофизиологическим упражнением. Он не является клиническим диагнозом и не заменяет очного медицинского осмотра."

        questionnaire = db.scalar(select(Questionnaire).where(Questionnaire.test_id == test.id))
        if not questionnaire:
            questionnaire = Questionnaire(
                test_id=test.id,
                definition_version="v2.5",
                questions=[_question(slug, mod["metric"])],
                scoring_config={
                    "metric": mod["metric"],
                    "result_type": "exercise_performance",
                },
                is_published=True,
            )
            db.add(questionnaire)

    db.commit()
    return changed
