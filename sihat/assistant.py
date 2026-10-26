"""Safe current-dialog assistant with a typed, validated UI-action allowlist."""

from collections import defaultdict, deque
from time import monotonic
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.assistant_schemas import AssistantAction, AssistantMessageInput, AssistantMessageOutput
from sihat.auth import get_current_user_optional
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


def _safe_result_context(db: Session, user: User | None, result_ids: list[str]) -> list[dict[str, object]]:
    if not result_ids:
        return []
    if not user:
        raise HTTPException(status_code=404, detail="A shared result was not found")
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


def _validated_action(action: object, db: Session, user: User | None) -> AssistantAction | None:
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
        test = db.scalar(
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
        if not user or not isinstance(result_id, str) or not db.get(SavedResult, result_id):
            return None
        saved = db.get(SavedResult, result_id)
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


def _fallback(user_text: str = "") -> AssistantMessageOutput:
    low = user_text.lower().strip()
    actions: list[AssistantAction] = []

    # 1. Emergency / Acute symptoms
    if any(k in low for k in ["бол", "температур", "давлен", "плохо", "сердц", "pain", "hurt", "dizzy", "emergency", "дышать", "одышк", "травм", "дард"]):
        msg = (
            "⚠️ Внимание: Платформа SIHAT does not diagnose conditions or prescribe treatment. "
            "Если вы испытываете сильную боль, давящие ощущения в груди, внезапную потерю зрения/слуха, одышку или резкое ухудшение самочувствия, "
            "немедленно вызовите бригаду скорой помощи (103 / 112) или обратитесь в ближайший приёмный покой больницы!"
        )

    # 2. Greetings
    elif any(k in low for k in ["привет", "здравствуй", "салам", "салом", "добрый", "хай", "hello", "hi", "start"]):
        msg = (
            "Здравствуйте! Я клинический навигатор платформы SIHAT (Сиҳат). "
            "Я помогаю подобрать научно обоснованные скрининги сенсорных функций (зрение, слух, внимание), "
            "объясняю условия калибровки экрана и паспорта методик. "
            "Платформа SIHAT does not diagnose conditions (не ставит диагнозов и не назначает лекарств), "
            "а служит доказательным инструментом объективной самопроверки. С чего вы хотите начать?"
        )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 3. Catalog / What tests exist / Capabilities
    elif any(k in low for k in ["что ты умеешь", "какие тесты", "список", "возможности", "что делать", "помоги выбрать", "тесты", "каталог", "все тесты"]):
        msg = (
            "В каталоге SIHAT доступны ключевые направления самопроверки:\n"
            "1. 👁️ Зрение (ISO 8596) — оптотипы Ландольта C, контрастная чувствительность (Pelli-Robson), таблицы Рабкина/Ишихары.\n"
            "2. 👂 Слух (ISO 8253-1) — тональная аудиометрия чистых тонов (250–8000 Гц) и разборчивость речи в шуме.\n"
            "3. 🧠 Внимание и память — таблицы Шульте 5×5, тест Струпа, блоки Корси и Digit Span.\n"
            "4. ⚡ Сенсомоторика — измерение скорости простой реакции (Donders A).\n"
            "Платформа SIHAT does not diagnose conditions. Выберите направление или откройте полный каталог."
        )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    # 4. Color blindness / Rabkin & Ishihara plates
    elif any(k in low for k in ["дальтон", "цвет", "исихар", "рабкин", "color", "ранг", "цветовосприят", "цветоощущ"]):
        msg = (
            "Для проверки цветового зрения доступен полихроматический тест на цветоощущение (таблицы Рабкина и Ишихары). "
            "Скрининг выявляет признаки протанопии, дейтеранопии (красно-зелёная слепота) и других аномалий цветовосприятия с распознаванием цифр и геометрических фигур. "
            "Проходите тест при естественном освещении без фильтров защиты глаз и ночного режима экрана. "
            "SIHAT does not diagnose conditions."
        )
        actions.append(
            AssistantAction(
                name="open_test",
                arguments={
                    "slug": "color-perception",
                    "test_slug": "color-perception",
                    "title": "Тест на дальтонизм (Рабкин и Ишихара)",
                },
            )
        )

    # 5. Hearing / Pure tone audiometry
    elif any(k in low for k in ["слух", "ухо", "слыш", "громк", "hear", "ear", "sound", "аудио", "шунавоӣ", "гӯш", "тиннитус", "шум в ушах"]):
        msg = (
            "Для оценки слухового восприятия в каталоге представлен скрининг порогов слышимости чистых тонов (250–8000 Гц, стандарт ISO 8253-1). "
            "Рекомендуется проходить в проводных наушниках в тихой комнате. Установите громкость устройства не более 60%, чтобы избежать акустической травмы. "
            "Если вас беспокоит постоянный шум или звон в ушах (тиннитус), обратитесь к врачу-сурдологу или оториноларингологу. "
            "SIHAT does not diagnose conditions."
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

    # 6. Contrast Sensitivity (Pelli-Robson)
    elif any(k in low for k in ["контраст", "пэлли", "робсон", "contrast", "равшанӣ"]):
        msg = (
            "Для оценки контрастной чувствительности доступен тест Pelli-Robson. "
            "Он определяет порог восприятия слабоконтрастных оптотипов при ступенчатом снижении контрастности до 1%, что важно при ночном вождении и раннем зрительном утомлении. "
            "SIHAT does not diagnose conditions."
        )
        actions.append(
            AssistantAction(
                name="open_test",
                arguments={
                    "slug": "contrast-sensitivity",
                    "test_slug": "contrast-sensitivity",
                    "title": "Контрастная чувствительность (Pelli-Robson)",
                },
            )
        )

    # 7. Vision / Landolt C
    elif any(k in low for k in ["зрен", "глаз", "видеть", "vision", "eye", "оптотип", "ландольт", "бино", "чашм", "близорук", "дальнозор"]):
        msg = (
            "Для проверки зрительного анализатора доступен скрининг остроты зрения на базе оптотипов Ландольта C (стандарт ISO 8596). "
            "Перед прохождением теста экран калибруется на расстояние вытянутой руки (~50–60 см). "
            "При зрительной утомляемости офтальмологи рекомендуют правило 20-20-20: каждые 20 минут смотрите на 20 футов (6 метров) вдаль в течение 20 секунд. "
            "Напоминаем: SIHAT does not diagnose conditions."
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

    # 8. Attention / Schulte tables / Stroop
    elif any(k in low for k in ["памят", "вниман", "струп", "шульт", "концентр", "cognit", "memory", "stroop", "мозг", "хотира", "диққат", "устал", "фокус"]):
        msg = (
            "Для оценки концентрации, устойчивости внимания и скорости когнитивной обработки доступен скрининг на базе таблиц Шульте (5 × 5). "
            "Упражнение измеряет темп зрительного поиска, динамику врабатываемости и умственную утомляемость. "
            "Помогает объективно оценить ментальную устойчивость и способность к фокусировке. "
            "SIHAT does not diagnose conditions."
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

    # 9. Simple Reaction Speed
    elif any(k in low for k in ["реакц", "скорост", "reaction", "рефлекс", "аксуламал"]):
        msg = (
            "Для измерения сенсомоторной реакции на визуальный стимул доступен тест скорости простой реакции (методика Donders A). "
            "Тест фиксирует латентное время моторного ответа в миллисекундах и стабильность нервных процессов. "
            "SIHAT does not diagnose conditions."
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

    # 10. Sleep / Insomnia
    elif any(k in low for k in ["сон", "спать", "бессон", "sleep", "хоб", "засыпа"]):
        msg = (
            "В нашей базе знаний собраны клинические рекомендации по гигиене здорового сна: "
            "регулярное время отхода ко сну и подъема, исключение ярких экранов за 1 час до сна, температура спальни 18–20°C и ограничение кофеина во второй половине дня. "
            "SIHAT does not diagnose conditions, но в каталоге доступен опросник дневной сонливости."
        )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/faq"}))

    # 11. Privacy & Data deletion
    elif any(k in low for k in ["удал", "приватн", "сохран", "данн", "privacy", "delete", "махфият", "нест"]):
        msg = (
            "Архитектура SIHAT построена по принципу Zero-Retention: "
            "все скрининги обрабатываются в оперативной памяти браузера. После завершения сессии вы сами решаете: "
            "нажать «Сохранить» в личный зашифрованный архив или «Не сохранять» — тогда данные немедленно и безвозвратно удаляются с сервера. "
            "SIHAT does not diagnose conditions."
        )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/history"}))

    # 12. Methodology / Standards
    elif any(k in low for k in ["метод", "научн", "стандарт", "iso", "кто создал", "паспорт", "доказатель"]):
        msg = (
            "Каждый модуль на платформе SIHAT имеет открытый паспорт методики: первоисточники в PubMed/ISO, класс доказательности, калибровочные условия и клинические ограничения. "
            "Мы не вычисляем псевдонаучные 'проценты здоровья', а даём точные объективные параметры. "
            "Платформа SIHAT does not diagnose conditions."
        )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/faq"}))

    # 13. General default
    else:
        msg = (
            "Я клинический навигатор SIHAT. Помогаю выбрать программу скрининга (зрение, слух, внимание), "
            "объясняю условия калибровки и принципы доказательной медицины. "
            "Вы можете спросить меня: «Как проверить слух?», «Как проверить зрение?», «Тест на дальтонизм» или перейти сразу в каталог. "
            "SIHAT does not diagnose conditions or prescribe treatment."
        )
        actions.append(AssistantAction(name="navigate_to_page", arguments={"target": "/catalog"}))

    return AssistantMessageOutput(message=msg, actions=actions, provider_available=False)


@router.post("/message", response_model=AssistantMessageOutput)
def send_message(
    payload: AssistantMessageInput,
    request: Request,
    db: Session = Depends(get_db_session),
    user: User | None = Depends(get_current_user_optional),
    settings: Settings = Depends(get_settings),
) -> AssistantMessageOutput:
    user_id = user.id if user else (request.client.host if request.client else "guest")
    _enforce_rate_limit(f"{user_id}:{request.client.host if request.client else 'unknown'}")
    shared_results = _safe_result_context(db, user, payload.shared_result_ids)
    conversation = [message.model_dump() for message in payload.conversation]
    conversation.append({"role": "user", "text": payload.text})
    try:
        raw = generate_assistant_response(
            settings=settings,
            conversation=conversation,
            shared_results=shared_results,
            api_key=payload.api_key,
        )
    except GeminiUnavailableError:
        return _fallback(payload.text)
    message = raw.get("message")
    if not isinstance(message, str) or not message.strip() or len(message) > 2000:
        return _fallback(payload.text)
    raw_actions = raw.get("actions", [])
    if not isinstance(raw_actions, list):
        return _fallback(payload.text)
    actions = [
        validated
        for item in raw_actions
        if (validated := _validated_action(item, db, user)) is not None
    ]
    return AssistantMessageOutput(message=message.strip(), actions=actions, provider_available=True)
