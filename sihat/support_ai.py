"""AI Support Agent for SIHAT HealthTech Platform.
- Automatically handles and answers simple inquiries (tests, methodologies, privacy, PDF exports, navigation).
- Detects complex issues (bugs, technical failures, account problems, complaints, requests for humans)
  and immediately escalates to a human administrator with priority flags.
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
    r"позовите\s+(человека|оператора|админа|администратора|специалиста)",
    r"живой\s+человек",
    r"свяжите\s+с\s+(человеком|оператором|админом|администратором|специалистом)",
    r"соедините\s+с\s+(человеком|оператором|админом|администратором|специалистом)",
    r"нужен\s+(человек|оператор|администратор|живой\s+человек|специалист)",
    r"хочу\s+поговорить\s+с\s+(человеком|админом|оператором)",
    r"одамашро\s+фарёд\s+кун",
    r"оператор\s+(лозим|даркор)",
    r"бо\s+одам\s+гап\s+занам",
    r"мутахассис\s+лозим",
    r"(talk|speak)\s+to\s+(a\s+)?(human|person|agent|representative|operator)",
    r"(connect|transfer)\s+me\s+to\s+(a\s+)?(human|person|agent|admin)",
    r"real\s+person",
    r"human\s+support",
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
            "Салом! Муроҷиати шумо сабт шуд ва аз рӯи хусусияти худ иштироки шахсии мутахассисро талаб мекунад.\n\n"
            f"📌 **Ҳолат:** Барои баррасии шахсӣ ба мудири навбатдори SIHAT равона гардид ({reason}).\n\n"
            "Мутахассис огоҳинома гирифт ва дар ҳамин чат ба шумо посух хоҳад дод. Лутфан дар тамос бошед!"
        )
    if lang == "en":
        return (
            "Hello! Your request has been recorded and classified as requiring personal review by a SIHAT administrator.\n\n"
            f"📌 **Status:** Escalated to human administrator for personal review ({reason}). Priority: High.\n\n"
            "A support specialist has been notified and will reply directly in this chat thread shortly. Thank you for your patience!"
        )
    return (
        "Здравствуйте! Ваш запрос зафиксирован и классифицирован как требующий индивидуального участия специалиста / администратора платформы.\n\n"
        f"📌 **Статус:** Передано администратору на личное рассмотрение ({reason}). Приоритет: высокий.\n\n"
        "Дежурный специалист уже получил уведомление и ответит вам прямо в этом диалоге в ближайшее время. Пожалуйста, оставайтесь на связи!"
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
                "💡 *Агар ба шумо кӯмаки инсон лозим бошад, танҳо нависед: «Одамашро фарёд кун».*"
            )
        return (
            "**Таблица Шульте** — это научно обоснованный тест на концентрацию и устойчивость внимания.\n\n"
            "• **Задача:** Находить и кликать числа от 1 до 25 по порядку как можно быстрее.\n"
            "• **Что измеряется:** Время прохождения, темп внимания и динамика усталости.\n"
            "• Как начать: перейдите в раздел «Каталог тестов» и нажмите на карточку «Концентрация внимания (Шульте)».\n\n"
            "💡 *Если вам потребуется связь с человеком, напишите: «Позовите человека».*"
        )

    # 2. Stroop test
    if "струп" in low or "stroop" in low:
        if lang == "tj":
            return (
                "**Санҷиши Струп** — пажӯҳиши чандирии маърифатӣ ва таваҷҷӯҳи интихобӣ мебошад.\n\n"
                "• **Вазифа:** Ба шумо калима бо ранги дигар нишон дода мешавад (масалан, калимаи «СУРХ» бо ранги кабуд навишта шудааст). Шумо бояд ранги ҳарфро интихоб намоед, на худи калимаро.\n"
                "• **Чӣ санҷида мешавад:** Назорати маърифатӣ ва суръати боздории вокунишҳои автоматикӣ.\n\n"
                "💡 *Агар ба шумо мутахассис лозим бошад, нависед: «Одамашро фарёд кун».*"
            )
        return (
            "**Эффект Струпа** — исследование когнитивной гибкости и избирательного внимания.\n\n"
            "• **Суть:** Вам показывается слово (например, «КРАСНЫЙ»), написанное синим цветом. Задача — выбрать именно цвет шрифта, преодолевая автоматическое чтение слова.\n"
            "• **Что измеряется:** Когнитивный контроль и скорость торможения импульсивных реакций.\n\n"
            "💡 *Если вам потребуется связь с человеком, напишите: «Позовите человека».*"
        )

    # 3. Privacy & explicit consent
    if any(w in low for w in ["согласи", "приватн", "сохран", "махфият", "save", "privacy"]):
        if lang == "tj":
            return (
                "**Назорати нигоҳдории натиҷаҳо дар SIHAT:**\n\n"
                "1. Платформа дар реҷаи ҳадди аксари маҳфият (privacy-first) кор мекунад.\n"
                "2. Дар танзимоти утоқи шахсӣ тугмачаи **«Нигоҳдорӣ танҳо бо розигии возеҳ»** мавҷуд аст.\n"
                "3. Ҳангоми фаъол будани ин тугмача, натиҷаҳо ба пойгоҳи додаҳо танҳо баъд аз пахши тугмаи «Нигоҳ доштани натиҷа» сабт мешаванд.\n"
                "4. Шумо метавонед дар дилхоҳ вақт сабтҳои худро пурра нест кунед.\n\n"
                "💡 *Агар саволи мураккаб дошта бошед, нависед: «Одамашро фарёд кун».*"
            )
        return (
            "**Контроль сохранения результатов в SIHAT:**\n\n"
            "1. По умолчанию платформа работает в режиме максимальной приватности.\n"
            "2. В настройках личного кабинета есть тумблер **«Сохранение только с явного согласия»**.\n"
            "3. При включённом тумблере результаты упражнений сохраняются в базу данных только если вы явно нажмёте кнопку «Сохранить результат».\n"
            "4. В любой момент вы можете экспортировать архив или удалить свои попытки в один клик.\n\n"
            "💡 *Если вам нужен оператор, напишите: «Позовите человека».*"
        )

    # 4. PDF Report
    if any(w in low for w in ["pdf", "скачать", "отчет", "экспорт", "ҳисобот", "download"]):
        if lang == "tj":
            return (
                "**Экспорти ҳисоботи PDF дар SIHAT:**\n\n"
                "1. Ба Утоқи шахсӣ → бахши «Натиҷаҳои ман» гузаред ё санҷиши анҷомёфтаро боз кунед.\n"
                "2. Дар қисми боло тугмаи **«Экспорти ҳисоботи PDF»**-ро пахш намоед.\n"
                "3. Дар танзимот метавонед тугмачаи «Шомил кардани шиносномаи методӣ дар PDF»-ро фаъол созед, то маълумоти илмӣ ба таври худкор илова шавад.\n\n"
                "💡 *Барои тамос бо мутахассис нависед: «Одамашро фарёд кун».*"
            )
        return (
            "**Экспорт PDF-отчётов в SIHAT:**\n\n"
            "1. Перейдите в Личный кабинет → вкладка «Мои результаты» или откройте завершённое тестирование.\n"
            "2. В верхней части нажмите кнопку **«Экспорт отчёта PDF»**.\n"
            "3. В настройках кабинета можно включить тумблер **«Включать паспорт методики в PDF»**, чтобы в отчёт автоматически добавлялись научные источники и параметры оборудования.\n\n"
            "💡 *Если у вас возникла техническая сложность, напишите: «Позовите человека».*"
        )

    # 5. Audio / Sound
    if any(w in low for w in ["звук", "овоз", "аудио", "sound", "слух"]):
        return (
            "**Настройка звукового сопровождения:**\n\n"
            "• Проверьте тумблер **«Звуковое сопровождение в тестах»** в Личном кабинете → вкладка «Настройки».\n"
            "• Там же доступна кнопка **«Проверить звук»**, воспроизводящая тестовый сигнал частотой 1000 Гц.\n"
            "• Убедитесь, что звук включен на вашем устройстве и в браузере предоставлен доступ к аудио.\n\n"
            "💡 *Если звук всё равно не воспроизводится, напишите: «Позовите человека».*"
        )

    return None


async def classify_and_generate_reply(user_msg: str, lang: str) -> tuple[bool, str, str]:
    """Returns (is_simple, reason, reply_text).
    is_simple=False triggers admin escalation flag.
    """
    clean = user_msg.strip()

    # 1. Check human escalation
    for pat in _COMPILED_HUMAN:
        if pat.search(clean):
            reason = "Запрос связи с администратором / оператором"
            reply = _format_escalation_reply(lang, reason)
            return False, reason, reply

    # 2. Check critical triggers
    for pat in _COMPILED_CRITICAL:
        if pat.search(clean):
            reason = "Сложная техническая неполадка, ошибка или жалоба"
            reply = _format_escalation_reply(lang, reason)
            return False, reason, reply

    # 3. Check offline knowledge base
    offline = _get_offline_knowledge_reply(clean, lang)
    if offline:
        return True, "Автоответ на частый вопрос о платформе", offline

    # 4. Use Gemini LLM
    settings = get_settings()
    active_key = settings.gemini_api_key.get_secret_value() if settings.gemini_is_configured else None
    if not active_key:
        return (
            True,
            "Базовый автоответ",
            "Здравствуйте! Благодарим за обращение в службу поддержки SIHAT.\n\n"
            "SIHAT — интерактивная платформа для научно обоснованного скрининга когнитивных и сенсорных способностей (15 упражнений на внимание, память, реакцию, слух и зрение). Обратите внимание: платформа не ставит клинических диагнозов.\n\n"
            "Вы можете изучить методики в «Паспорте методик» или начать тестирование из каталога. Если ваш вопрос требует участия специалиста, напишите: «Позовите человека»."
        )

    system_prompt = (
        "Вы — официальный ИИ-ассистент первой линии службы поддержки HealthTech платформы SIHAT.\n"
        "SIHAT включает 15 научно обоснованных упражнений (Шульте, Струп, Корси, Тахистоскоп, Двойная переработка, Реакция на свет/звук, Звуковой порог, Поле зрения, Контрастность Габора, Тремор, Пинч-захват, Координация).\n"
        "SIHAT предоставляет скрининг и самоконтроль, НЕ ставит диагнозов.\n"
        "Правила классификации:\n"
        "1. 'is_simple': true — если вопрос касается работы тестов, нахождения результатов, скачивания PDF, приватности, паспортов методик, общих вопросов здоровья и скрининга.\n"
        "   В этом случае дайте исчерпывающий, вежливый, четкий ответ со списками. В конце обязательно добавьте: '💡 Если вам потребуется помощь человека, напишите: «Позовите человека»'.\n"
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

    # Fallback
    return (
        True,
        "Стандартный автоответ",
        "Здравствуйте! Ваше обращение принято службой поддержки SIHAT. Если вам требуется индивидуальная консультация администратора платформы, пожалуйста, напишите «Позовите человека» прямо в этот чат."
    )


async def process_user_support_message_ai(
    db: AsyncSession,
    ticket: SupportTicket,
    user_msg_text: str,
    user: User | None,
) -> SupportMessage | None:
    """Processes user support message with AI.
    Generates AI reply, updates ticket status/escalation notes, commits to DB,
    and broadcasts via WebSocket to both user and admin rooms in real-time.
    """
    if ticket.is_blocked:
        return None

    lang = detect_language(user_msg_text)
    is_simple, reason, reply_text = await classify_and_generate_reply(user_msg_text, lang)

    # 1. Update ticket status & escalation flag
    if not is_simple:
        ticket.status = "in_progress"
        ticket.admin_notes = f"[ЭСКАЛАЦИЯ АДМИНИСТРАТОРУ]: {reason}. Требуется личный ответ администратора."
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

    # 3. Broadcast AI message in real time to ticket room, user, and admins
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
        "status": ticket.status,
        "is_blocked": ticket.is_blocked,
        "admin_notes": ticket.admin_notes,
        "last_message": ai_msg.message,
        "last_message_at": ai_msg.created_at.isoformat(),
        "unread_user_count": 1,
        "unread_admin_count": 0,
    }

    try:
        await ws_manager.broadcast_new_message(
            ticket_id=ticket.id,
            message=msg_dict,
            ticket=ticket_dict,
            recipient_user_id=ticket.user_id,
        )
    except Exception as e:
        logger.warning("Failed to broadcast AI message: %s", e)

    return ai_msg
