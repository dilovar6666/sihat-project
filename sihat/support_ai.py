"""AI Support Agent for SIHAT HealthTech Platform.
- Automatically handles and answers simple inquiries (tests, methodologies, privacy, PDF exports, navigation).
- Detects requests for human administrator or complex issues and permanently disables AI for that chat,
  escalates the ticket, and alerts the administrator.
"""

from datetime import datetime, timezone
import json
import logging
import re
from typing import Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from sihat.config import get_settings
from sihat.models import SupportMessage, SupportTicket, User
from sihat.ws import ws_manager

logger = logging.getLogger(__name__)

# Explicit triggers that require immediate handoff to human administrator
HUMAN_AGENT_TRIGGERS = [
    r"\bпозови(те)?\s*(человека|оператора|админа|администратора|специалиста|сотрудника|менеджера)\b",
    r"\b(свяжи|свяжите|соедини|соедините)\s*(с\s*)?(человеком|оператором|админом|администратором|специалистом|поддержкой)\b",
    r"\b(нужен|нужна|требуется)\s*(человек|оператор|администратор|админ|специалист|сотрудник|живой)\b",
    r"\bхочу\s*(поговорить|пообщаться)\s*с\s*(человеком|админом|оператором)\b",
    r"\b(живой\s+человек|позовите\s+админа|позови\s+человека)\b",
    r"\b(одам|корманд|мутахассис|админ|оператор)\s*(лозим|даркор|фарёд)\b",
    r"\bбо\s*(одам|администратор|мутахассис)\s*пайваст\b",
    r"\b(talk|speak)\s+to\s+(a\s+)?(human|person|agent|representative|operator|admin)\b",
    r"\b(connect|transfer)\s+me\s+to\s+(a\s+)?(human|person|agent|admin|operator)\b",
    r"\b(human\s+support|real\s+person)\b",
    r"^\s*(человек|админ|оператор|human|admin)\s*$",
]

CRITICAL_COMPLEX_TRIGGERS = [
    r"(ошибка|сбой|код ошибки)\s*(500|502|503|504|403)",
    r"сайт\s+(сломался|упал|не\s+открывается|завис|не\s+работает)",
    r"(меня|мой\s+аккаунт)\s+(заблокировали|забанили|взломали)",
    r"(верните|возврат)\s+(деньги|средств)",
    r"(жалоба|претензия|иск|юрист|суд)",
    r"(у\s+меня|диагноз|назначьте)\s+(рак|опухоль|инсульт|инфаркт|таблетки|лекарство)",
    r"хатогӣ\s*(500|502|504)",
    r"(шикоят|додгоҳ|ҳуқуқшинос|пулро\s+баргардонед)",
    r"(server\s+crash|fatal\s+error|account\s+hacked|account\s+banned)",
    r"(refund|lawsuit|complaint|legal\s+action)",
]

_COMPILED_HUMAN = [re.compile(p, re.IGNORECASE) for p in HUMAN_AGENT_TRIGGERS]
_COMPILED_CRITICAL = [re.compile(p, re.IGNORECASE) for p in CRITICAL_COMPLEX_TRIGGERS]


def detect_language(text: str) -> str:
    """Detect if query is in Tajik, Russian or English."""
    tj_chars = set("ғӣӯҳҷқҒӢӮҲҶҚ")
    if any(c in tj_chars for c in text):
        return "tj"
    if re.search(r"\b(салом|чист|чихел|барои|машқ|даркор|натиҷа|ҳамин|ҳамчун|бояд)\b", text, re.IGNORECASE):
        return "tj"
    if re.search(r"[а-яА-ЯёЁ]", text):
        return "ru"
    return "en"


def _format_escalation_reply(lang: str, reason: str) -> str:
    if lang == "tj":
        return (
            "🛑 **Ёрдамчии AI хомӯш карда шуд.**\n\n"
            "Муроҷиати шумо ба мудири навбатдори платформаи SIHAT равона карда шуд.\n"
            "Маъмур огоҳинома гирифт ва ба зудӣ дар ҳамин чат ба шумо посух хоҳад дод. Лутфан интизор шавед!"
        )
    if lang == "en":
        return (
            "🛑 **AI assistant is disabled.**\n\n"
            "Your inquiry has been transferred to the duty administrator of the SIHAT platform.\n"
            "The administrator has been notified and will reply in this chat thread shortly. Please stand by!"
        )
    return (
        "🛑 **ИИ-ассистент отключён.**\n\n"
        "Ваше обращение передано дежурному администратору платформы SIHAT.\n"
        "Администратор получил уведомление и скоро подключится к диалогу в этом чате. Пожалуйста, ожидайте ответа!"
    )


def _get_offline_knowledge_reply(text: str, lang: str) -> str | None:
    """Pre-built high-quality answers for common platform questions if Gemini is unavailable."""
    low = text.lower()

    # 1. Schulte table
    if "шульте" in low or "schulte" in low:
        if lang == "tj":
            return (
                "**Ҷадвали Шульте** — ин санҷиши суръат ва устувории таваҷҷӯҳ мебошад.\n\n"
                "• **Мақсад:** Пайдарпай ёфтани рақамҳо аз 1 то 25 дар шабакаи 5×5.\n"
                "• **Чӣ санҷида мешавад:** Суръати коркарди иттилооти визуалӣ ва паҳншавии таваҷҷӯҳ.\n"
                "• Барои гузаштан: ба бахши «Феҳристи тестҳо» гузаред ва «Ҷадвали Шульте»-ро интихоб намоед.\n\n"
                "💡 Агар хоҳед, ки бо одам суҳбат кунед, нависед: «Позовите админа» ё тугмаи болоро пахш кунед."
            )
        return (
            "**Таблица Шульте** — это научно обоснованный тест на концентрацию и устойчивость внимания.\n\n"
            "• **Задача:** Находить и кликать числа от 1 до 25 по порядку как можно быстрее.\n"
            "• **Что измеряется:** Время прохождения, темп внимания и динамика врабатываемости/усталости.\n"
            "• **Как начать:** Перейдите в «Каталог тестов» и выберите «Таблицы Шульте».\n\n"
            "💡 Если вам нужен живой администратор, напишите «Позовите админа» или нажмите кнопку «Позвать человека» вверху."
        )

    # 2. Stroop test
    if "струп" in low or "stroop" in low:
        return (
            "**Эффект Струпа** — классический тест когнитивной гибкости и избирательного внимания.\n\n"
            "• **Задача:** Называть цвет шрифта, игнорируя значение написанного слова.\n"
            "• **Интерференция:** Измеряет время задержки при конфликте зрительного и семантического восприятия.\n\n"
            "💡 Чтобы связаться с администратором, напишите: «Позовите человека»."
        )

    # 3. Corsi block
    if "корси" in low or "corsi" in low:
        return (
            "**Блоки Корси (Corsi Block-Tapping)** — золотой стандарт оценки рабочей пространственной памяти.\n\n"
            "• **Задача:** Воспроизвести последовательность загорающихся кубиков в прямом или обратном порядке.\n"
            "• **Объем:** Определяет объем вашей зрительно-пространственной кратковременной памяти.\n\n"
            "💡 Чтобы связаться с администратором, напишите: «Позовите человека»."
        )

    # 4. Privacy & saving results
    if any(k in low for k in ["приватн", "сохран", "баз", "данны", "privacy", "махфи"]):
        return (
            "**Конфиденциальность и хранение данных в SIHAT:**\n\n"
            "• Платформа работает по принципу явного согласия (Explicit Consent).\n"
            "• Результаты тестов сохраняются в базе **только если вы нажмёте кнопку «Сохранить результат»**.\n"
            "• Вы можете полностью отключить автосохранение в Личном кабинете (раздел «Настройки»).\n"
            "• В истории сохраняются только объективные метрики без диагнозов.\n\n"
            "💡 Если у вас есть вопрос к администрации, напишите «Позовите человека»."
        )

    # 5. PDF Export
    if any(k in low for k in ["pdf", "экспорт", "скачать отч", "распечат"]):
        return (
            "**Экспорт отчётов в PDF:**\n\n"
            "• После завершения любого упражнения или в Личном кабинете нажмите «Скачать отчёт PDF».\n"
            "• В отчёт включаются графики, сырые метрики, паспорт методики и сравнение с референтными нормами.\n\n"
            "💡 Если нужна помощь специалиста, напишите: «Позовите человека»."
        )

    # 6. General Greetings
    if any(k in low for k in ["привет", "здравствуй", "салом", "добрый день", "добрый вечер", "hello", "hi"]):
        return (
            "Здравствуйте! Я ИИ-ассистент первой линии платформы SIHAT.\n\n"
            "Я готов ответить на ваши вопросы по 15 упражнениям скрининга (внимание, память, реакция, слух, зрение), сохранению результатов или экспорту отчётов в PDF.\n\n"
            "Чем я могу вам помочь?\n\n"
            "💡 Если вам требуется связь с живым администратором, просто напишите: «Позовите админа» или нажмите кнопку «Позвать человека» вверху."
        )

    # 7. Short or unclear query
    if len(clean_text(text)) < 5 or bool(re.match(r"^[a-zA-Zа-яА-Я0-9\s,\.]+$", text) and len(text.split()) <= 2):
        return (
            "Здравствуйте! Я ИИ-ассистент службы поддержки SIHAT.\n\n"
            "Уточните, пожалуйста, ваш вопрос подробнее (например: как пройти тест Шульте, как сохранить результаты или скачать PDF).\n\n"
            "💡 Если вы хотите связаться с живым администратором платформы, напишите: «Позовите человека» или нажмите кнопку «Позвать человека» вверху."
        )

    return None


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


async def classify_and_generate_reply(text: str, lang: str) -> tuple[bool, str, str]:
    """Returns (is_simple, reason, reply_text).
    is_simple=False means it is escalated to human administrator.
    """
    clean = clean_text(text)

    # 1. Check explicit human request
    for pat in _COMPILED_HUMAN:
        if pat.search(clean):
            return False, "Запрос связи с администратором / оператором", _format_escalation_reply(lang, "Запрос связи с администратором")

    # 2. Check critical technical/financial/legal issues
    for pat in _COMPILED_CRITICAL:
        if pat.search(clean):
            return False, "Критический технический или юридический инцидент", _format_escalation_reply(lang, "Критический инцидент")

    # 3. Check offline knowledge base
    offline = _get_offline_knowledge_reply(clean, lang)
    if offline:
        return True, "Автоответ на частый вопрос о платформе", offline

    # 4. Use Gemini LLM if configured
    settings = get_settings()
    active_key = settings.gemini_api_key.get_secret_value() if settings.gemini_is_configured else None
    if not active_key:
        return (
            True,
            "Базовый автоответ",
            "Здравствуйте! Благодарим за обращение в службу поддержки SIHAT.\n\n"
            "SIHAT — интерактивная платформа для научно обоснованного скрининга когнитивных и сенсорных способностей (15 упражнений на внимание, память, реакцию, слух и зрение). Обратите внимание: платформа не ставит клинических диагнозов.\n\n"
            "Вы можете изучить методики в «Паспорте методик» или начать тестирование из каталога.\n\n"
            "💡 Если ваш вопрос требует участия специалиста, напишите: «Позовите админа» или нажмите кнопку «Позвать человека» вверху."
        )

    system_prompt = (
        "Вы — официальный ИИ-ассистент первой линии службы поддержки HealthTech платформы SIHAT.\n"
        "SIHAT включает 15 научно обоснованных упражнений (Шульте, Струп, Корси, Тахистоскоп, Двойная переработка, Реакция на свет/звук, Звуковой порог, Поле зрения, Контрастность Габора, Тремор, Пинч-захват, Координация).\n"
        "SIHAT предоставляет скрининг и самоконтроль, НЕ ставит диагнозов.\n"
        "Правила классификации:\n"
        "1. 'is_simple': true — если вопрос касается работы тестов, нахождения результатов, скачивания PDF, приватности, паспортов методик, общих вопросов платформы.\n"
        "   В этом случае дайте исчерпывающий, вежливый, четкий ответ со списками. В конце обязательно добавьте: '💡 Если вам потребуется помощь человека, напишите: «Позовите админа»'.\n"
        "2. 'is_simple': false — если вопрос содержит баг, ошибку сайта, жалобу, взлом, требование возврата денег или запрос связи с живым человеком.\n"
        "Язык ответа: строго язык запроса (" + lang + ").\n"
        'Верните строго JSON: {"is_simple": true|false, "reason": "...", "reply": "..."}'
    )

    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    async with httpx.AsyncClient(timeout=14.0) as client:
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                res = await client.post(
                    url,
                    params={"key": active_key},
                    json={
                        "systemInstruction": {"parts": [{"text": system_prompt}]},
                        "contents": [{"role": "user", "parts": [{"text": clean}]}],
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "maxOutputTokens": 1000,
                        },
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(raw_text)
                    is_simple = bool(parsed.get("is_simple", True))
                    reason = str(parsed.get("reason", "Консультация ИИ"))
                    reply = str(parsed.get("reply", ""))
                    if not is_simple:
                        reply = _format_escalation_reply(lang, reason)
                    return is_simple, reason, reply
            except Exception as e:
                logger.warning("Gemini support responder failed on %s: %s", model, e)
                continue

    # Safe friendly fallback
    return (
        True,
        "Консультация службы поддержки",
        "Здравствуйте! Я ИИ-ассистент платформы SIHAT. Готов помочь вам с прохождением когнитивных упражнений, сохранением результатов или экспортом PDF-отчётов.\n\n"
        "💡 Если вам требуется индивидуальный ответ администратора, напишите «Позовите человека» или воспользуйтесь кнопкой «Позвать человека» вверху диалога."
    )


async def process_user_support_message_ai(
    db: AsyncSession,
    ticket: SupportTicket,
    user_msg_text: str,
    user: User | None,
) -> SupportMessage | None:
    """Processes user support message with AI.
    - If AI is inactive (disabled by escalation), ignores completely.
    - If user requests human or encounters critical issue, turns off AI permanently for this ticket,
      marks needs_human=True, sends escalation handoff, and broadcasts to admin.
    - Otherwise, generates helpful AI response and keeps it between user and AI.
    """
    if ticket.is_blocked:
        return None

    # Check if AI was already disabled for this ticket
    if not getattr(ticket, "is_ai_active", True):
        logger.info("AI is inactive for ticket %s; skipping AI response.", ticket.id)
        return None

    lang = detect_language(user_msg_text)
    is_simple, reason, reply_text = await classify_and_generate_reply(user_msg_text, lang)

    # 1. Update ticket status & escalation flag
    if not is_simple:
        ticket.is_ai_active = False
        ticket.needs_human = True
        ticket.status = "in_progress"
        ticket.admin_notes = f"[ЭСКАЛАЦИЯ АДМИНИСТРАТОРУ]: {reason}. ИИ отключён."
    else:
        if ticket.status == "open":
            ticket.status = "in_progress"
        ticket.admin_notes = f"[ИИ-ответ]: {reason}."

    # 2. Create AI support message
    ai_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="ai",
        sender_id=None,
        sender_name="ИИ-ассистент SIHAT",
        message=reply_text,
        read_by_user=False,
        read_by_admin=True,
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)
    await db.refresh(ticket)

    # 3. Broadcast AI message in real time
    msg_dict = {
        "id": ai_msg.id,
        "ticket_id": ai_msg.ticket_id,
        "sender_type": ai_msg.sender_type,
        "sender_id": ai_msg.sender_id,
        "sender_name": ai_msg.sender_name,
        "message": ai_msg.message,
        "created_at": ai_msg.created_at.isoformat(),
        "read_by_user": ai_msg.read_by_user,
        "read_by_admin": ai_msg.read_by_admin,
    }
    ticket_dict = {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "contact_email": ticket.contact_email,
        "subject": ticket.subject,
        "status": ticket.status,
        "is_blocked": ticket.is_blocked,
        "is_ai_active": ticket.is_ai_active,
        "needs_human": ticket.needs_human,
        "admin_notes": ticket.admin_notes,
        "last_message": ai_msg.message,
        "last_message_at": ai_msg.created_at.isoformat(),
        "unread_user_count": 1,
        "unread_admin_count": 1 if ticket.needs_human else 0,
    }

    event_name = "human_requested" if not is_simple else "new_message"

    try:
        await ws_manager.broadcast_new_message(
            ticket_id=ticket.id,
            message=msg_dict,
            ticket=ticket_dict,
            recipient_user_id=ticket.user_id,
            event=event_name,
        )
    except Exception as e:
        logger.warning("Failed to broadcast AI message: %s", e)

    return ai_msg
