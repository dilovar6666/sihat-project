"""Safe current-dialog assistant with a typed, validated UI-action allowlist
and intelligent multilingual support for Russian (RU), Tajik (TJ), and English (EN).
"""

import asyncio
from collections import defaultdict, deque
from datetime import datetime, timezone
from time import monotonic
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from sihat.ai_guard import classify_ai_request

from sihat.assistant_schemas import AssistantAction, AssistantMessageInput, AssistantMessageOutput
from sihat.auth import get_current_user_optional
from sihat.config import Settings, get_settings
from sihat.db import get_db_session
from sihat.gemini import (
    GeminiUnavailableError,
    generate_assistant_response,
    generate_assistant_response_async,
)
from sihat.models import AiSecurityIncident, SavedResult, TestDefinition, User

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


async def _safe_result_context(
    db: AsyncSession, user: User | None, result_ids: list[str]
) -> list[dict[str, object]]:
    if not result_ids:
        return []
    if not user:
        raise HTTPException(status_code=404, detail="A shared result was not found")
    results = (
        await db.scalars(
            select(SavedResult).where(
                SavedResult.user_id == user.id, SavedResult.id.in_(result_ids)
            )
        )
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


async def _validated_action(
    action: object, db: AsyncSession, user: User | None
) -> AssistantAction | None:
    if not isinstance(action, dict) or not isinstance(action.get("name"), str):
        return None
    name = action["name"]
    arguments = action.get("arguments", {})
    if name not in _ALLOWED_ACTIONS or not isinstance(arguments, dict):
        return None
    if name in {"open_test", "open_test_description", "prepare_test_start"}:
        slug = arguments.get("slug") or arguments.get("test_slug")
        if not isinstance(slug, str):
            return None
        test = await db.scalar(
            select(TestDefinition).where(
                TestDefinition.slug == slug, TestDefinition.availability_status == "published"
            )
        )
        if not test:
            return None
        title = arguments.get("title")
        if not title and test.localizations and isinstance(test.localizations, dict):
            ru_loc = test.localizations.get("ru")
            en_loc = test.localizations.get("en")
            if isinstance(ru_loc, dict) and ru_loc.get("title"):
                title = ru_loc.get("title")
            elif isinstance(en_loc, dict) and en_loc.get("title"):
                title = en_loc.get("title")
        args: dict[str, Any] = {"slug": slug, "test_slug": slug}
        if title:
            args["title"] = str(title)
        return AssistantAction(
            name=name,
            arguments=args,
            requires_confirmation=name == "prepare_test_start",
        )
    if name == "show_test_results":
        result_id = arguments.get("result_id")
        if not user or not isinstance(result_id, str):
            return None
        saved = await db.get(SavedResult, result_id)
        if not saved or saved.user_id != user.id:
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
        return AssistantAction(name=name) if user else None
    return None


def _detect_lang(user_text: str, preferred_lang: str | None = None) -> str:
    low = user_text.lower().strip()
    # 1. Check for specific Tajik Cyrillic letters
    tj_letters = {"ғ", "ӣ", "ӯ", "ҳ", "ҷ", "қ"}
    if any(c in low for c in tj_letters):
        return "tj"

    # Common Tajik words
    tj_words = [
        "салом", "чихел", "чихели", "чихеле", "чи кор", "чӣ кор", "лозим", "чи лозим", "чӣ лозим",
        "ман", "шумо", "кардан", "мехоҳам", "мехохам", "дард", "биноӣ", "шунавоӣ", "хотира",
        "диққат", "ранг", "натиҷа", "барои", "метавонам", "хато", "хуб", "ҳамин", "хамин",
        "кадом", "чист", "чихел аст", "нафас", "сарам"
    ]
    if any(w in low for w in tj_words):
        return "tj"

    # 2. Check for English (Latin count > Cyrillic count)
    latin_count = sum(1 for c in low if "a" <= c <= "z")
    cyrillic_count = sum(1 for c in low if "а" <= c <= "я" or c in tj_letters)

    en_words = [
        "what", "how", "why", "who", "which", "when", "where", "can", "should", "need",
        "help", "test", "vision", "hearing", "color", "blind", "memory", "attention",
        "reaction", "hello", "hi", "hey", "catalog", "result", "doctor", "health",
        "anxiety", "stress", "sleep", "tired", "headache"
    ]
    if latin_count > cyrillic_count and (any(w in low for w in en_words) or latin_count > 4):
        return "en"

    # 3. If mostly Russian Cyrillic
    if cyrillic_count > 0:
        return "ru"

    # Fallback to UI preferred language if available
    if preferred_lang in ("ru", "tj", "tg", "en"):
        return "tj" if preferred_lang in ("tj", "tg") else preferred_lang

    return "ru"


def _fallback(user_text: str = "", preferred_lang: str | None = None) -> AssistantMessageOutput:
    lang = _detect_lang(user_text, preferred_lang)
    low = user_text.lower().strip()
    actions: list[AssistantAction] = []

    # 1. EMERGENCY / ACUTE SYMPTOMS
    if any(k in low for k in ["бол", "температур", "давлен", "плохо", "сердц", "одышк", "травм", "дард", "нафас", "pain", "hurt", "dizzy", "emergency", "chest"]):
        if lang == "tj":
            msg = (
                "⚠️ **Диққат:** Платформаи SIHAT ёрии таъҷилии тиббиро иваз намекунад ва ташхиси клиникӣ намегузорад. "
                "Агар шумо дарди шадид, фишор дар қафаси сина, якбора хира шудан ё гум шудани биноӣ ва шунавоӣ, ё нафастангиро эҳсос кунед — "
                "фавран ба хадамоти ёрии таъҷилӣ (103 ё 112) занг занед ё ба беморхонаи наздиктарин муроҷиат намоед!"
            )
        elif lang == "en":
            msg = (
                "⚠️ **Urgent Medical Notice:** The SIHAT platform does not provide emergency medical care or diagnosis. "
                "If you are experiencing severe pain, chest tightness, sudden vision or hearing loss, shortness of breath, "
                "or acute deterioration of your condition, immediately call emergency medical services (103 / 112 / 911) "
                "or visit the nearest emergency hospital!"
            )
        else:
            msg = (
                "⚠️ **Внимание:** Платформа SIHAT не является службой скорой помощи и не заменяет экстренного осмотра врача. "
                "Если вы испытываете сильную боль, давящие ощущения в груди, внезапную потерю зрения или слуха, "
                "одышку или резкое ухудшение самочувствия — немедленно вызовите бригаду скорой помощи (103 / 112) "
                "или обратитесь в ближайший приёмный покой больницы!"
            )

    # 1B. GREETINGS & SMALL TALK
    elif any(k in low for k in ["привет", "здравствуй", "добрый день", "доброе утро", "добрый вечер", "салом", "алейкум", "hello", "hi", "hey"]):
        if lang == "tj":
            msg = (
                "Салом! Хуш омадед ба SIHAT. Ман ёвари ҳушманди шумо ҳастам ва омодаам дар интихоби машқҳои когнитивӣ ё санҷиши биноӣ ва шунавоӣ кӯмак расонам. "
                "Шумо мехоҳед кадом қобилиятро санҷед — диққат, хотира, аксуламал ё биниш?"
            )
        elif lang == "en":
            msg = (
                "Hello! Welcome to SIHAT. I'm your interactive health tech assistant, here to help guide you through our 15 cognitive and sensory exercises. "
                "What would you like to explore today — attention, memory, reaction speed, vision, or hearing?"
            )
        else:
            msg = (
                "Привет! Рад вас приветствовать на платформе SIHAT. Я ваш персональный помощник и помогу сориентироваться среди 15 интерактивных упражнений — "
                "для проверки памяти, внимания, скорости реакции, зрения и слуха. С чего начнём?"
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 1C. WHAT IS THIS SITE / ЧТО ЭТО ЗА САЙТ
    elif any(k in low for k in ["что это за сайт", "что за сайт", "что такое sihat", "что здесь делать", "ин чихел сайт", "ин сомона чист", "what is this site", "what is sihat", "about this website"]):
        if lang == "tj":
            msg = (
                "**SIHAT («Саломатии худро фаҳм»)** — ин платформаи муосири худназоратӣ ва таҳлили қобилиятҳои маърифатӣ ва сенсорӣ мебошад. "
                "Дар ин ҷо 15 машқи интерактивӣ мавҷуданд: ҷадвалҳои Шулте, блокҳои Корси, ҳассосияти контрастӣ, санҷиши нутқ дар садо ва суръати вокуниш. "
                "Ҳар як санҷиш супориши беназир тавлид мекунад ва натиҷаҳои шумо танҳо дар ихтиёри худатон мемонанд. Мехоҳед як санҷишро оғоз кунед?"
            )
        elif lang == "en":
            msg = (
                "**SIHAT (Understand Your Health)** is an evidence-based platform for personal cognitive and sensory self-monitoring. "
                "It features 15 scientifically grounded interactive exercises covering attention, working memory, contrast perception, auditory discrimination, and reaction speed. "
                "Every session generates fresh randomized challenges, and results belong strictly to you. Would you like to try an exercise?"
            )
        else:
            msg = (
                "**SIHAT («Пойми своё здоровье»)** — это научно обоснованная платформа для объективного самоконтроля когнитивных и сенсорных способностей. "
                "Здесь доступно 15 интерактивных упражнений: Таблицы Шульте, блоки Корси, различение контраста, проверка речи в шуме, скорость реакции и координация. "
                "Каждое задание генерируется заново на сервере, а результаты сохраняются только с вашего согласия. Хотите посмотреть каталог упражнений?"
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 1D. HOW ARE YOU / КАК ДЕЛА
    elif any(k in low for k in ["как дела", "как ты", "чихели", "чихелӣ", "чӣ ҳол дорӣ", "how are you", "how are u"]):
        if lang == "tj":
            msg = (
                "Ташаккур, ман хеле хуб ҳастам! Омодаам ба шумо дар интихоби машқҳо ва омӯзиши имкониятҳои худ кӯмак кунам. "
                "Шумо чӣ ҳол доред? Оё мехоҳед сатҳи тамаркуз ё суръати аксуламалатонро бисанҷед?"
            )
        elif lang == "en":
            msg = (
                "I'm doing great, thank you for asking! I'm ready to help you explore our exercises or interpret your results. "
                "How are you feeling today? Would you like to check your focus, memory, or reaction speed?"
            )
        else:
            msg = (
                "Всё отлично, спасибо! С удовольствием помогу вам с упражнениями или отвечу на любые вопросы по платформе. "
                "Как ваше самочувствие? Хотите проверить концентрацию внимания или скорость реакции?"
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 1E. WHO ARE YOU / КТО ТЫ
    elif any(k in low for k in ["кто ты", "ты кто", "кисти", "ту кисти", "who are you", "what are you"]):
        if lang == "tj":
            msg = (
                "Ман ёвари ҳушманди SIHAT ҳастам. Вазифаи ман — фаҳмонидани қоидаҳои машқҳо, кӯмак дар интихоби санҷишҳои мувофиқ ва тавзеҳи нишондиҳандаҳо мебошад."
            )
        elif lang == "en":
            msg = (
                "I am SIHAT's AI companion and navigator. My role is to help you discover relevant screening exercises, understand scoring metrics, and track your personal progress."
            )
        else:
            msg = (
                "Я интеллектуальный ассистент платформы SIHAT. Моя задача — помогать вам ориентироваться в каталоге из 15 упражнений, подсказывать правила и объяснять полученные результаты."
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 1F. THANKS / СПАСИБО
    elif any(k in low for k in ["спасибо", "благодар", "раҳмат", "рахмат", "ташаккур", "thank", "thanks"]):
        if lang == "tj":
            msg = "Саломат бошед! Ҳамеша шодам, ки ба шумо кӯмак расонам. Агар саволи дигар дошта бошед, бо камоли майл посух медиҳам."
        elif lang == "en":
            msg = "You're very welcome! Always happy to help. Let me know whenever you'd like to try another exercise or have questions."
        else:
            msg = "Всегда пожалуйста! Рад быть полезным. Если появятся вопросы по упражнениям или результатам — обращайтесь!"

    # 1B. DIAGNOSIS & CLINICAL DISCLAIMER
    elif any(k in low for k in ["диагноз", "лечен", "ташхис", "табобат", "diagnos", "prescrib", "cure"]):
        if lang == "tj":
            msg = (
                "Платформаи SIHAT ташхиси тиббӣ намегузорад ва дору таъин намекунад. "
                "Ин сомона танҳо барои худсанҷӣ ва мониторинги фаъолияти когнитивӣ ва сенсорӣ пешбинӣ шудааст. "
                "Барои ташхиси дақиқ ва табобат ҳатман ба табиби мутахассис муроҷиат намоед."
            )
        elif lang == "en":
            msg = (
                "SIHAT is an educational self-monitoring and cognitive-sensory screening platform. "
                "SIHAT does not diagnose medical conditions, replace clinical consultations, or prescribe medications. "
                "For formal medical diagnosis and treatment, please consult a qualified healthcare professional."
            )
        else:
            msg = (
                "Платформа SIHAT предназначена для самостоятельного скрининга и самоконтроля, "
                "не ставит клинических диагнозов и не назначает лечение. "
                "Для постановки диагноза и назначения терапии обратитесь к профильному врачу."
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 2. NEEDS / SELECTION / "ЧТО МНЕ НАДО" / "БА МАН ЧИ ЛОЗИМ" / "WHAT DO I NEED"
    elif any(k in low for k in [
        "что мне надо", "что мне нужно", "ба ман чи лозим", "ба ман чӣ лозим", "what do i need",
        "с чего начать", "посоветуй", "что выбрать", "что пройти", "какой тест", "что делать",
        "чи кор кунам", "чӣ кор кунам", "чихел сар кунам", "what should i do", "recommend"
    ]):
        if lang == "tj":
            msg = (
                "Барои он ки бидонед аз кадом санҷиш оғоз кардан беҳтар аст, ба эҳсосот ва ҳадафи худ нигаред:\n\n"
                "• **Аз компютер чашмонатон хаста мешаванд ё норавшан мебинед?**\n"
                "  Тавсия медиҳем аз **Тезиши биноӣ** (ISO 8596) ва **Ҳассосияти контрастӣ** оғоз кунед.\n\n"
                "• **Тамаркузи диққат душвор шудааст ё зуд монда мешавед?**\n"
                "  Санҷиши **Ҷадвалҳои Шулте** (5 × 5) барои устувории диққат ва **Хотираи кӯтоҳмуддат**-ро бисанҷед.\n\n"
                "• **Мехоҳед суръати аксуламал ва рефлексҳоро чен кунед?**\n"
                "  Санҷиши стандартии **Суръати аксуламали оддӣ** (Donders A).\n\n"
                "• **Дар фарқкунии рангҳо ё тобишҳо шубҳа доред?**\n"
                "  Экспресс-санҷиши **Дальтонизм** бо рақамҳо, ҳарфҳо ва шаклҳо.\n\n"
                "• **Сатҳи стресс ё нигаронӣ зиёд шудааст?**\n"
                "  Пурсишномаи стандартии **GAD-7** барои баҳодиҳии ҳолати равонӣ.\n\n"
                "Аз кадом самт оғоз кардан мехоҳед? Метавонед феҳристи санҷишҳоро кушоед ё якеро интихоб намоед."
            )
        elif lang == "en":
            msg = (
                "To choose the most relevant screening for your current needs, consider what you want to evaluate:\n\n"
                "• **Eye strain, blurred focus, or frequent screen work?**\n"
                "  Start with **Visual Acuity** (ISO 8596) and **Contrast Sensitivity**.\n\n"
                "• **Difficulty concentrating, brain fog, or mental fatigue?**\n"
                "  Try **Schulte Attention Tables** (5 × 5) and **Short-Term Memory** (Digit Span).\n\n"
                "• **Testing nervous system response and reflexes?**\n"
                "  Take the **Simple Reaction Speed** test (Donders A).\n\n"
                "• **Checking color perception and spectral cones?**\n"
                "  Take the standardized **Color Blindness Screening**.\n\n"
                "• **Experiencing stress, anxiety, or nervous tension?**\n"
                "  Complete the clinical **GAD-7 Generalized Anxiety Scale**.\n\n"
                "Which area would you like to explore first? You can also open the full catalog to browse all available modules."
            )
        else:
            msg = (
                "Чтобы понять, какие тесты вам лучше пройти, ориентируйтесь на то, что вас сейчас беспокоит или интересует:\n\n"
                "• **Устают глаза за экраном, двоится или падает чёткость?**\n"
                "  Рекомендуем начать с **Остроты зрения** (ISO 8596) и **Контрастной чувствительности**.\n\n"
                "• **Сложно сфокусироваться, рассеяно внимание или чувствуете спад сил?**\n"
                "  Пройдите **Таблицы Шульте** (5 × 5) на устойчивость концентрации и **Кратковременную память**.\n\n"
                "• **Хотите оценить подвижность нервной системы и рефлексы?**\n"
                "  Пройдите тест **Скорости простой реакции** (Donders A).\n\n"
                "• **Сомневаетесь в распознавании оттенков?**\n"
                "  Экспресс-тест на **Дальтонизм** (полихроматические таблицы Рабкина и колбочки L, M, S).\n\n"
                "• **Беспокоит уровень стресса или тревоги?**\n"
                "  Клинический опросник тревожности **GAD-7**.\n\n"
                "С какого направления хотите начать? Или можете открыть каталог и выбрать подходящий модуль."
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 3. COLOR BLINDNESS
    elif any(k in low for k in ["дальтон", "цвет", "исихар", "рабкин", "ранг", "цветовосприят", "цветоощущ", "color", "blind"]):
        if lang == "tj":
            msg = (
                "Барои ташхиси фарқкунии рангҳо дар платформа санҷиши стандартии дальтонизм мавҷуд аст. "
                "Он қобилияти кори колбачаҳои биноӣ (L, M, S)-ро санҷида, нишонаҳои протанопия ва дейтеранопияро (нобиноӣ ба ранги сурх ва сабз) ошкор менамояд. "
                "Санҷишро дар равшании табиӣ ва бе истифодаи филтрҳои шабонаи экран гузаронед."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "color-perception",
                        "test_slug": "color-perception",
                        "title": "Санҷиши дальтонизм",
                    },
                )
            )
        elif lang == "en":
            msg = (
                "For color vision assessment, SIHAT offers a standardized color blindness screening. "
                "It evaluates cone photoreceptor sensitivity (L, M, S) and detects protan and deutan deficiencies (red-green variations) "
                "using numbers, letters, and geometric shapes. "
                "Please perform the test under natural lighting with screen eye-comfort shields disabled."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "color-perception",
                        "test_slug": "color-perception",
                        "title": "Color Vision Screening",
                    },
                )
            )
        else:
            msg = (
                "Для оценки цветового зрения доступен стандартизированный тест на дальтонизм. "
                "Скрининг исследует чувствительность колбочек сетчатки (спектры L, M, S) и выявляет проявления протанопии и дейтеранопии "
                "с распознаванием цифр, букв и геометрических фигур. "
                "Рекомендуется проходить тест при естественном освещении без фильтров защиты глаз и ночного режима экрана."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "color-perception",
                        "test_slug": "color-perception",
                        "title": "Тест на дальтонизм",
                    },
                )
            )

    # 4. VISION / EYE STRAIN / LANDOLT C
    elif any(k in low for k in ["зрен", "глаз", "видеть", "бино", "чашм", "близорук", "дальнозор", "размыт", "vision", "eye", "landolt"]):
        if lang == "tj":
            msg = (
                "Барои санҷиши қувваи биноӣ методи байналмилалии оптотипҳои Ландольт C (стандарти ISO 8596) амал мекунад. "
                "Пеш аз санҷиш экранро ба масофаи дасти дарозшуда (~50–60 см) мувофиқ кунед. "
                "Дар ҳолати хастагии чашм аз қоидаи тиббии 20-20-20 истифода баред: ҳар 20 дақиқа ба масофаи 6 метр барои 20 сония нигоҳ кунед."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "visual-perception",
                        "test_slug": "visual-perception",
                        "title": "Тезиши биноӣ (ISO 8596)",
                    },
                )
            )
        elif lang == "en":
            msg = (
                "For visual acuity screening, SIHAT uses the standardized ISO 8596 Landolt C optotype protocol. "
                "Calibrate your screen to approximately arm's length (~50–60 cm) before starting. "
                "To reduce digital eye strain, ophthalmologists recommend the 20-20-20 rule: every 20 minutes, look at an object 20 feet away for 20 seconds."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "visual-perception",
                        "test_slug": "visual-perception",
                        "title": "Visual Acuity (Landolt C)",
                    },
                )
            )
        else:
            msg = (
                "Для проверки зрительного анализатора доступен скрининг остроты зрения на базе оптотипов Ландольта C (стандарт ISO 8596). "
                "Перед прохождением теста экран калибруется на расстояние вытянутой руки (~50–60 см). "
                "При зрительной утомляемости офтальмологи рекомендуют правило 20-20-20: каждые 20 минут смотрите на 6 метров вдаль в течение 20 секунд."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "visual-perception",
                        "test_slug": "visual-perception",
                        "title": "Острота зрения (Кольца Ландольта C)",
                    },
                )
            )

    # 5. HEARING / AUDIOMETRY
    elif any(k in low for k in ["слух", "ухо", "слыш", "громк", "аудио", "шунавоӣ", "гӯш", "тиннитус", "шум в ушах", "hear", "ear", "sound", "audiometry"]):
        if lang == "tj":
            msg = (
                "Барои баҳодиҳии шунавоӣ санҷиши пороговии овозҳои тоза (250–8000 Гц, стандарти ISO 8253-1) пешбинӣ шудааст. "
                "Санҷишро дар гӯшмонакҳо дар ҳуҷраи ором гузаронед ва баландии овозро аз 60% зиёд накунед. "
                "Агар садои доимӣ ё занг задан дар гӯшҳо шуморо азият диҳад, ба духтури мутахассиси ЛОР муроҷиат намоед."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "sound-discrimination",
                        "test_slug": "sound-discrimination",
                        "title": "Аудиометрияи тоналӣ (250–8000 Гц)",
                    },
                )
            )
        elif lang == "en":
            msg = (
                "For auditory assessment, SIHAT provides pure-tone threshold audiometry (250–8000 Hz, ISO 8253-1 standard). "
                "We recommend wearing wired headphones in a quiet room and setting device volume to no more than 60% for acoustic safety. "
                "If you experience persistent ringing or buzzing (tinnitus), consult an ENT physician."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "sound-discrimination",
                        "test_slug": "sound-discrimination",
                        "title": "Pure Tone Audiometry (250–8000 Hz)",
                    },
                )
            )
        else:
            msg = (
                "Для оценки слухового восприятия в каталоге представлен скрининг порогов слышимости чистых тонов (250–8000 Гц, стандарт ISO 8253-1). "
                "Рекомендуется проходить в проводных наушниках в тихой комнате. Установите громкость устройства не более 60%, чтобы избежать акустической травмы. "
                "Если вас беспокоит постоянный шум или звон в ушах (тиннитус), обратитесь к врачу-сурдологу или оториноларингологу."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "sound-discrimination",
                        "test_slug": "sound-discrimination",
                        "title": "Тональная аудиометрия (250–8000 Гц)",
                    },
                )
            )

    # 6. ATTENTION & MEMORY (SCHULTE TABLES / DIGIT SPAN)
    elif any(k in low for k in ["вниман", "памят", "концентр", "шульт", "струп", "мозг", "хотира", "диққат", "attention", "memory", "schulte", "focus", "fog"]):
        if lang == "tj":
            msg = (
                "Барои санҷиши тамаркуз ва устувории диққат аз **Ҷадвалҳои Шулте** (5 × 5) истифода баред. "
                "Он суръати ҷустуҷӯи биноӣ ва устувории кори мағзи сарро дақиқ нишон медиҳад. "
                "Барои санҷиши ҳаҷми хотираи корӣ инчунин санҷиши қатори рақамҳои Векслер (Digit Span) дастрас аст."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "attention-concentration",
                        "test_slug": "attention-concentration",
                        "title": "Ҷадвалҳои Шулте (5 × 5)",
                    },
                )
            )
        elif lang == "en":
            msg = (
                "To evaluate focal concentration and attention stability, we recommend the **Schulte 5 × 5 Matrix Grid**. "
                "It measures visual search rate, cognitive endurance, and mental fatigue dynamics. "
                "For working memory capacity, the Wechsler Digit Span test is also available."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "attention-concentration",
                        "test_slug": "attention-concentration",
                        "title": "Schulte Attention Tables (5 × 5)",
                    },
                )
            )
        else:
            msg = (
                "Для оценки концентрации, устойчивости внимания и скорости когнитивной обработки доступен скрининг на базе таблиц Шульте (5 × 5). "
                "Упражнение измеряет темп зрительного поиска, динамику врабатываемости и умственную утомляемость. "
                "Для оценки объёма рабочей памяти доступен тест цифровых рядов Векслера (Digit Span)."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "attention-concentration",
                        "test_slug": "attention-concentration",
                        "title": "Таблицы Шульте (5 × 5)",
                    },
                )
            )

    # 7. REACTION SPEED
    elif any(k in low for k in ["реакц", "скорост", "рефлекс", "аксуламал", "reaction", "reflex"]):
        if lang == "tj":
            msg = (
                "Барои чен кардани суръати аксуламали биноӣ-ҳаракатӣ санҷиши Donders A пешниҳод шудааст. "
                "Ин санҷиш вақти пинҳонии посухи асабҳоро бо миллисонияҳо чен карда, устувории системаи асабро нишон медиҳад."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "reaction-speed",
                        "test_slug": "reaction-speed",
                        "title": "Суръати аксуламали оддӣ",
                    },
                )
            )
        elif lang == "en":
            msg = (
                "To measure visual-motor response latency, take the Simple Reaction Speed test (Donders A methodology). "
                "It records response time in milliseconds and assesses psychomotor stability."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "reaction-speed",
                        "test_slug": "reaction-speed",
                        "title": "Simple Reaction Speed",
                    },
                )
            )
        else:
            msg = (
                "Для измерения сенсомоторной реакции на визуальный стимул доступен тест скорости простой реакции (методика Donders A). "
                "Тест фиксирует латентное время моторного ответа в миллисекундах и стабильность нервных процессов."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "reaction-speed",
                        "test_slug": "reaction-speed",
                        "title": "Скорость простой реакции",
                    },
                )
            )

    # 8. STRESS / ANXIETY / GAD-7
    elif any(k in low for k in ["стресс", "тревог", "нерв", "паник", "ташвиш", "фишор", "stress", "anxiety", "gad"]):
        if lang == "tj":
            msg = (
                "Барои баҳодиҳии дараҷаи стресс ва ташвиш опросники стандартии GAD-7 (Generalized Anxiety Disorder 7) мавҷуд аст. "
                "Он ба таври далелнок сатҳи фишори эҳсосиро муайян карда, нишон медиҳад, ки оё ба истироҳат ва машварати мутахассис эҳтиёҷ ҳаст ё не."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "gad-7",
                        "test_slug": "gad-7",
                        "title": "Шкалаи ташвиши GAD-7",
                    },
                )
            )
        elif lang == "en":
            msg = (
                "For objective assessment of stress and worry, SIHAT includes the evidence-based GAD-7 (Generalized Anxiety Disorder 7-item scale). "
                "It calculates an anxiety severity index and helps track emotional equilibrium."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "gad-7",
                        "test_slug": "gad-7",
                        "title": "GAD-7 Generalized Anxiety Scale",
                    },
                )
            )
        else:
            msg = (
                "Для объективной оценки уровня эмоционального напряжения и тревожности доступен клинический опросник GAD-7. "
                "Шкала рассчитывает стандартизированный индекс выраженности тревоги и помогает отслеживать психоэмоциональное равновесие."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "gad-7",
                        "test_slug": "gad-7",
                        "title": "Шкала тревожности GAD-7",
                    },
                )
            )

    # 9. SLEEP / INSOMNIA / FATIGUE
    elif any(k in low for k in ["сон", "спать", "бессон", "устал", "хоб", "монда", "хаста", "sleep", "insomnia", "tired"]):
        if lang == "tj":
            msg = (
                "Барои барқарор кардани нерӯ ва хоби бароҳат қоидаҳои гигиенаи хобро риоя намоед: "
                "реҷаи мунтазами хоб, қатъи истифодаи экранҳо 1 соат пеш аз хоб ва ҳарорати муносиби хона (18–20°C). "
                "Дар платформа метавонед тести **Ритми сиркадӣ ва гигиенаи рақамӣ**-ро гузаред."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "daily-activity",
                        "test_slug": "daily-activity",
                        "title": "Ритми сиркадӣ ва хоб",
                    },
                )
            )
        elif lang == "en":
            msg = (
                "For healthy restorative sleep, follow clinical sleep hygiene: consistent sleep-wake cycles, "
                "cutting off bright blue screens 1 hour before bedtime, bedroom temperature between 18–20°C, and limiting afternoon caffeine. "
                "You can also take our **Circadian Hygiene & Light Alignment** screening."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "daily-activity",
                        "test_slug": "daily-activity",
                        "title": "Circadian Hygiene & Light Alignment",
                    },
                )
            )
        else:
            msg = (
                "Для восстановления сил и здорового сна рекомендуем соблюдать правила гигиены сна: "
                "постоянное время отхода ко сну, исключение ярких экранов за 1 час до сна, температура спальни 18–20°C и ограничение кофеина во второй половине дня. "
                "В каталоге доступен модуль оценки **Циркадианного ритма и цифровой гигиены**."
            )
            actions.append(
                AssistantAction(
                    name="open_test",
                    arguments={
                        "slug": "daily-activity",
                        "test_slug": "daily-activity",
                        "title": "Циркадианный ритм и гигиена",
                    },
                )
            )

    # 10. GREETINGS
    elif any(k in low for k in ["привет", "здравствуй", "салам", "салом", "добрый", "хай", "hello", "hi", "hey"]):
        if lang == "tj":
            msg = (
                "Салом! Ман ёвари клиникии платформаи SIHAT ҳастам. "
                "Ба шумо барои интихоб ва гузаштани санҷишҳои далелноки биноӣ, шунавоӣ, хотира, тамаркуз ва аксуламал кӯмак мерасонам. "
                "Мехоҳед кадом қобилиятро бисанҷед ё ба кадом нишонаҳо таваҷҷуҳ доред?"
            )
        elif lang == "en":
            msg = (
                "Hello! I am your SIHAT clinical navigation assistant. "
                "I help you choose evidence-based screenings for vision, hearing, memory, attention, reaction speed, and emotional wellbeing. "
                "What would you like to explore or evaluate today?"
            )
        else:
            msg = (
                "Здравствуйте! Я клинический навигатор платформы SIHAT (Сиҳат). "
                "Я помогаю подобрать научно обоснованные скрининги сенсорных функций (зрение, слух, внимание, реакция) "
                "и объясняю принципы калибровки. Что вас интересует или с какого теста хотите начать?"
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 11. PRIVACY & ZERO-RETENTION
    elif any(k in low for k in ["удал", "приватн", "сохран", "данн", "махфият", "нест", "privacy", "delete", "zero-retention"]):
        if lang == "tj":
            msg = (
                "Меъмории платформаи SIHAT бар асоси принсипи Zero-Retention сохта шудааст: "
                "ҳамаи маълумоти санҷиш танҳо дар хотираи фаврии дастгоҳи шумо коркард мешаванд. "
                "Пас аз анҷом шумо худатон интихоб мекунед: натиҷаро ба бойгонии маҳрами худ сабт кунед ё бе сабт комилан тоза намоед."
            )
        elif lang == "en":
            msg = (
                "SIHAT is built on Zero-Retention privacy principles: all sensory telemetry is processed ephemeral in your browser memory. "
                "After completing a session, you decide whether to save the encrypted protocol to your private profile or discard it permanently with zero trace on the server."
            )
        else:
            msg = (
                "Архитектура SIHAT построена по принципу Zero-Retention: "
                "все скрининги обрабатываются исключительно в оперативной памяти вашего браузера. "
                "После теста вы сами решаете: сохранить результат в личный зашифрованный архив или стереть без сохранения — в таком случае данные мгновенно удаляются."
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/history"}))

    # 12. GENERAL / DEFAULT
    else:
        if lang == "tj":
            msg = (
                "Ман ёвари клиникии SIHAT ҳастам ва омодаам дар интихоби санҷишҳои саломатӣ ва таҳлили нишондиҳандаҳо ба шумо кӯмак расонам. "
                "Шумо метавонед мустақиман пурсед: «Ба ман чӣ лозим?», «Санҷиши биноӣ», «Таблитсаҳои Шулте» ё феҳристи умумии санҷишҳоро кушоед."
            )
        elif lang == "en":
            msg = (
                "I am your SIHAT clinical assistant, here to help guide your cognitive and sensory screening journey. "
                "Please note that SIHAT does not diagnose medical conditions or replace clinical consultations. "
                "You can ask me: 'What do I need?', 'Test my hearing', 'Check visual acuity', 'Attention test', or explore the full catalog."
            )
        else:
            msg = (
                "Я клинический навигатор SIHAT и готов помочь вам подобрать подходящую программу скрининга. "
                "Обратите внимание: SIHAT не ставит клинических диагнозов. "
                "Вы можете спросить меня: «Что мне надо?», «Как проверить зрение?», «Таблицы Шульте», «Тест на слух» или перейти в полный каталог тестов."
            )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    return AssistantMessageOutput(message=msg, actions=actions, provider_available=False)


@router.post("/message", response_model=AssistantMessageOutput)
async def send_message(
    payload: AssistantMessageInput,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    user: User | None = Depends(get_current_user_optional),
    settings: Settings = Depends(get_settings),
) -> AssistantMessageOutput:
    if user and not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Ваш аккаунт заблокирован за нарушение правил платформы и подозрительную активность.",
        )

    user_id = user.id if user else (request.client.host if request.client else "guest")
    client_ip = request.client.host if request.client else "unknown"
    _enforce_rate_limit(f"{user_id}:{client_ip}")

    # 1. AI Safety Guard Check (detecting adversarial, prompt injection or harmful prompts)
    suspicion = classify_ai_request(payload.text)
    if suspicion:
        if user:
            # Query existing pending incident or create a new one
            incident = await db.scalar(
                select(AiSecurityIncident).where(
                    AiSecurityIncident.user_id == user.id,
                    AiSecurityIncident.status == "pending_review",
                )
            )
            query_record = {
                "text": payload.text.strip(),
                "category": suspicion["category"],
                "reason": suspicion["reason"],
                "severity": suspicion["severity"],
                "ip": client_ip,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            if incident:
                incident.suspicious_count += 1
                incident.severity = suspicion["severity"]
                incident.last_category = suspicion["category"]
                logs = list(incident.queries_log or [])
                logs.append(query_record)
                incident.queries_log = logs
                incident.updated_at = func.now()
            else:
                incident = AiSecurityIncident(
                    user_id=user.id,
                    user_email=user.email or f"user_{user.id[:8]}",
                    user_name=user.full_name,
                    suspicious_count=1,
                    severity=suspicion["severity"],
                    status="pending_review",
                    last_category=suspicion["category"],
                    queries_log=[query_record],
                )
                db.add(incident)
            await db.commit()

            # If user has sent 2 or more suspicious queries, alert the user and abort LLM call
            if incident.suspicious_count >= 2:
                warning_text = (
                    "⚠️ **Предупреждение безопасности:** Зафиксированы повторяющиеся подозрительные запросы "
                    f"к ИИ-ассистенту ({suspicion['reason']}). "
                    "Информация о вашем аккаунте и история сообщений автоматически передана администратору "
                    "для проверки и принятия решения о возможной блокировке доступа к сервису."
                )
                return AssistantMessageOutput(
                    message=warning_text,
                    actions=[],
                    provider_available=False,
                )
    shared_results = await _safe_result_context(db, user, payload.shared_result_ids)
    conversation = [message.model_dump() for message in payload.conversation]
    conversation.append({"role": "user", "text": payload.text})
    try:
        # Support test monkeypatching of either sync or async generator
        from sihat import gemini
        if generate_assistant_response != gemini.generate_assistant_response:
            res = generate_assistant_response(
                settings=settings,
                conversation=conversation,
                shared_results=shared_results,
                api_key=payload.api_key,
            )
            raw = await res if asyncio.iscoroutine(res) else res
        else:
            raw = await generate_assistant_response_async(
                settings=settings,
                conversation=conversation,
                shared_results=shared_results,
                api_key=payload.api_key,
            )
    except GeminiUnavailableError:
        return _fallback(payload.text, preferred_lang=payload.lang)
    message = raw.get("message")
    if not isinstance(message, str) or not message.strip() or len(message) > 2000:
        return _fallback(payload.text, preferred_lang=payload.lang)
    raw_actions = raw.get("actions", [])
    if not isinstance(raw_actions, list):
        return _fallback(payload.text, preferred_lang=payload.lang)
    actions = [
        validated
        for item in raw_actions
        if (validated := await _validated_action(item, db, user)) is not None
    ]
    return AssistantMessageOutput(message=message.strip(), actions=actions, provider_available=True)
