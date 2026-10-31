"""AI Support Agent for SIHAT HealthTech Platform.
- Automatically handles and answers simple inquiries (tests, methodologies, privacy, PDF exports, navigation).
- Speaks fluently in 3 languages (Tajik, Russian, English) dynamically adapting to the user.
- Detects requests for human administrator or complex issues, immediately turns off AI for that chat,
  escalates the ticket, and alerts the administrator in real time.
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

# Explicit triggers that require immediate handoff to human administrator (RU, TJ, EN)
HUMAN_AGENT_TRIGGERS = [
    # Russian
    r"\bпозови(те)?\s*(человека|оператора|админа|администратора|специалиста|сотрудника|менеджера|живого)\b",
    r"\b(свяжи|свяжите|соедини|соедините|переведи|переведите)\s*(с\s*|на\s*)?(человеком|человека|оператором|оператора|админом|админа|администратором|администратора|специалистом|специалиста|поддержкой)\b",
    r"\b(нужен|нужна|требуется|дай|дайте)\s*(человек|человека|оператор|оператора|администратор|администратора|админ|админа|специалист|специалиста|сотрудник|живой)\b",
    r"\bхочу\s*(поговорить|пообщаться|связаться)\s*(с\s*)?(человеком|админом|оператором|администратором)\b",
    r"\b(живой\s+человек|позовите\s+админа|позови\s+человека|позовите\s+человека|нужен\s+человек|нужен\s+админ)\b",
    
    # Tajik (special and standard Cyrillic letters + Latin variants)
    r"\bбо\s*(одам|маъмур|мутахассис|корманд)\s*пайваст(\s*кунед)?\b",
    r"\b(ба\s*)?маъмур(ро)?\s*(гузаронед|пайваст|фар[её]д)\b",
    r"\b(ба\s*)?одам(ро)?\s*(гузаронед|пайваст|фар[её]д)\b",
    r"\b(одам|корманд|мутахассис|маъмур|админ|оператор)\s*(лозим|даркор|фар[её]д)\b",
    r"\b(маъмур|одам|мутахассис)\s*даркор\b",
    r"\b(маъмур|одам|мутахассис)\s*лозим\b",
    r"\bмехо[хҳ]ам\s*бо\s*(маъмур|одам|мутахассис)\s*(гап\s*занам|су[хҳ]бат\s*кунам)\b",
    r"\bадмин(ро)?\s*(фар[её]д\s*кунед|пайваст\s*кунед|даркор|лозим)\b",
    r"\b(бо\s+одам|бо\s+маъмур)\b",
    r"\b(mamur|odam|admin)\s*(darkor|lozim|payvast|faryod)\b",
    r"\b(bo\s+odam|bo\s+mamur)\b",
    r"\b(ba\s+)?mamur(ro)?\s*(guzaroned|payvast)\b",

    # English
    r"\b(talk|speak)\s+(to|with)\s+(a\s+)?(human|person|agent|representative|operator|admin|administrator)\b",
    r"\b(connect|transfer)\s+(me\s+)?to\s+(a\s+)?(human|person|agent|admin|operator|administrator)\b",
    r"\b(call|contact|need)\s+(a\s+)?(human|person|admin|administrator|operator)\b",
    r"\b(human\s+support|real\s+person|human\s+agent|human\s+operator)\b",

    # Single-word urgent calls
    r"^\s*(человек|админ|оператор|администратор|маъмур|одам|мутахассис|human|admin|operator)\s*$",
]

CRITICAL_COMPLEX_TRIGGERS = [
    r"\b(ошибка|сбой|код ошибки)\s*(500|502|503|504|403)\b",
    r"\bсайт\s+(сломался|упал|не\s+открывается|завис|не\s+работает)\b",
    r"\b(меня|мой\s+аккаунт)\s+(заблокировали|забанили|взломали)\b",
    r"\b(верните|возврат)\s+(деньги|денег|средств)\b",
    r"\b(жалоба|претензия|судебный\s+иск|юрист|суд)\b",
    r"\b(у\s+меня|диагноз|назначьте)\s+(рак|опухоль|инсульт|инфаркт|таблетки|лекарство)\b",
    r"\bхатогӣ\s*(500|502|504)\b",
    r"\b(шикоят|додгоҳ|ҳуқуқшинос|пулро\s+баргардонед)\b",
    r"\b(server\s+crash|fatal\s+error|account\s+hacked|account\s+banned)\b",
    r"\b(refund|lawsuit|legal\s+action)\b",
]

_COMPILED_HUMAN = [re.compile(p, re.IGNORECASE) for p in HUMAN_AGENT_TRIGGERS]
_COMPILED_CRITICAL = [re.compile(p, re.IGNORECASE) for p in CRITICAL_COMPLEX_TRIGGERS]


def detect_language(text: str) -> str:
    """Detect if query is in Tajik, Russian or English."""
    tj_chars = set("ғӣӯҳҷқҒӢӮҲҶҚ")
    if any(c in tj_chars for c in text):
        return "tj"

    # Tajik vocabulary in standard Cyrillic
    tj_cyrillic_words = r"\b(салом|чист|чихел|барои|машқ|машк|даркор|натиҷа|натича|ҳамин|хамин|ҳамчун|бояд|шумо|ман|мо|дар|ба|аз|бо|одам|маъмур|мамур|мутахассис|кунед|кардан|гузаронед|пайваст|фарёд|фарйод|ёрдам|йордам|хуб|рахмат|ташаккур|мехоҳам|мехохам|донистан|чаро|кай|куҷо|кучо|ин|он|чи|чӣ|хотира|диққат|диккат|биниш|шунавоӣ|шунавои|суръат)\b"
    if re.search(tj_cyrillic_words, text, re.IGNORECASE):
        return "tj"

    # Tajik transliterated in Latin
    tj_latin_words = r"\b(salom|baroi|dastgiri|yordam|rahmat|tashakkur|shumo|man|dar|ba|az|bo|odam|mamur|adminro|payvast|darkor|lozim|chist|chikhel)\b"
    if re.search(tj_latin_words, text, re.IGNORECASE):
        return "tj"

    if re.search(r"[а-яА-ЯёЁ]", text):
        return "ru"

    return "en"


def _format_escalation_reply(lang: str, reason: str) -> str:
    if lang == "tj":
        return (
            "🛑 **Ёрдамчии AI хомӯш карда шуд.**\n\n"
            "Муроҷиати шумо фавран ба маъмури платформаи SIHAT равона карда шуд.\n"
            "Маъмур огоҳинома гирифт ва ба зудӣ дар ҳамин чат ба шумо посух медиҳад. Лутфан интизор шавед!"
        )
    if lang == "en":
        return (
            "🛑 **AI assistant is now disconnected.**\n\n"
            "Your conversation has been immediately transferred to the SIHAT platform administrator.\n"
            "The administrator has received a priority notification and will join this chat thread shortly. Please wait!"
        )
    return (
        "🛑 **ИИ-ассистент отключён.**\n\n"
        "Ваше обращение мгновенно передано администратору платформы SIHAT.\n"
        "Администратор получил уведомление и скоро подключится к диалогу в этом чате. Пожалуйста, ожидайте ответа!"
    )


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _get_offline_knowledge_reply(text: str, lang: str) -> str | None:
    """Pre-built high-quality answers for common platform questions in 3 languages."""
    low = text.lower()

    # 1. Schulte table
    if "шульте" in low or "schulte" in low:
        if lang == "tj":
            return (
                "**Ҷадвали Шульте** — ин санҷиши илмии суръат ва устувории таваҷҷӯҳ мебошад.\n\n"
                "• **Мақсад:** Пайдарпай ёфтани рақамҳо аз 1 то 25 дар шабакаи 5×5 дар кӯтоҳтарин муддат.\n"
                "• **Чӣ санҷида мешавад:** Суръати коркарди иттилооти визуалӣ ва паҳншавии таваҷҷӯҳ.\n"
                "• **Чӣ тавр оғоз кунем:** Ба бахши «Феҳристи тестҳо» гузаред ва «Ҷадвали Шульте»-ро интихоб намоед.\n\n"
                "💡 Агар ба шумо маъмури воқеӣ лозим бошад, танҳо дар чат нависед: «Ба маъмур гузаронед»."
            )
        if lang == "en":
            return (
                "**Schulte Table** is an evidence-based test measuring attention stability and visual search speed.\n\n"
                "• **Task:** Find and click numbers from 1 to 25 sequentially on a 5×5 grid as fast as possible.\n"
                "• **Metrics:** Total completion time, attention pace, and fatigue dynamics.\n"
                "• **How to start:** Open the 'Exercise Catalog' and choose 'Schulte Table'.\n\n"
                "💡 If you need to speak with a human administrator, simply write: 'Call admin' directly in this chat."
            )
        return (
            "**Таблица Шульте** — это научно обоснованный тест на концентрацию и устойчивость внимания.\n\n"
            "• **Задача:** Находить и кликать числа от 1 до 25 по порядку как можно быстрее.\n"
            "• **Что измеряется:** Время прохождения, темп внимания и динамика врабатываемости/усталости.\n"
            "• **Как начать:** Перейдите в «Каталог тестов» и выберите «Таблицы Шульте».\n\n"
            "💡 Если вам требуется живой администратор, просто напишите в этот чат: «Позовите админа»."
        )

    # 2. Stroop test
    if "струп" in low or "stroop" in low:
        if lang == "tj":
            return (
                "**Таъсири Струп (Stroop Effect)** — санҷиши классикии чандирии маърифатӣ ва таваҷҷӯҳи интихобӣ мебошад.\n\n"
                "• **Мақсад:** Муайян кардани ранги хатти калима, сарфи назар аз маънои худи калима.\n"
                "• **Чӣ санҷида мешавад:** Вақти таъхири ба амал омада дар натиҷаи ихтилофи дарки визуалӣ ва маъноӣ.\n\n"
                "💡 Агар ба шумо маъмури воқеӣ лозим бошад, танҳо дар чат нависед: «Ба маъмур гузаронед»."
            )
        if lang == "en":
            return (
                "**Stroop Effect Test** is a classic measure of cognitive flexibility and selective attention.\n\n"
                "• **Task:** Identify the font color of the word while ignoring the semantic meaning of the word itself.\n"
                "• **Metrics:** Interference delay and cognitive inhibition efficiency.\n\n"
                "💡 If you need to speak with an administrator, simply write 'Call admin' in this chat."
            )
        return (
            "**Эффект Струпа** — классический тест когнитивной гибкости и избирательного внимания.\n\n"
            "• **Задача:** Называть цвет шрифта, игнорируя значение написанного слова.\n"
            "• **Интерференция:** Измеряет время задержки при конфликте зрительного и семантического восприятия.\n\n"
            "💡 Чтобы связаться с администратором, просто напишите в этот чат: «Позовите человека»."
        )

    # 3. Corsi block
    if "корси" in low or "corsi" in low:
        if lang == "tj":
            return (
                "**Блокҳои Корси (Corsi Block-Tapping)** — стандарти тиллоӣ барои баҳодиҳии хотираи кӯтоҳмуддати фазоӣ.\n\n"
                "• **Мақсад:** Такрор кардани пайдарпаии мукаабҳои рӯшаншуда дар тартиби мустақим ё баръакс.\n"
                "• **Чӣ санҷида мешавад:** Ҳаҷми кории хотираи биноӣ-фазоӣ (Corsi Span).\n\n"
                "💡 Агар ба шумо маъмури воқеӣ лозим бошад, танҳо дар чат нависед: «Ба маъмур гузаронед»."
            )
        if lang == "en":
            return (
                "**Corsi Block-Tapping Test** is the clinical gold standard for assessing visuospatial short-term working memory.\n\n"
                "• **Task:** Reproduce the sequence of highlighted blocks in forward or reverse order.\n"
                "• **Metrics:** Visuospatial memory span (Corsi span score).\n\n"
                "💡 If you need an administrator, write 'Call admin' in this chat."
            )
        return (
            "**Блоки Корси (Corsi Block-Tapping)** — золотой стандарт оценки рабочей пространственной памяти.\n\n"
            "• **Задача:** Воспроизвести последовательность загорающихся кубиков в прямом или обратном порядке.\n"
            "• **Объем:** Определяет объем вашей зрительно-пространственной кратковременной памяти.\n\n"
            "💡 Чтобы связаться с администратором, напишите в чат: «Позовите человека»."
        )

    # 4. Privacy & saving results
    if any(k in low for k in ["приватн", "сохран", "баз", "данны", "privacy", "махфи", "сабт"]):
        if lang == "tj":
            return (
                "**Махфият ва нигоҳдории маълумот дар SIHAT:**\n\n"
                "• Платформа аз рӯи принсипи розигии ошкоро (Explicit Consent) кор мекунад.\n"
                "• Натиҷаҳои санҷиш танҳо вақте захира мешаванд, ки шумо тугмаи «Сабти натиҷа»-ро пахш намоед.\n"
                "• Шумо метавонед сабти худкорро дар Утоқи шахсӣ (бахши «Танзимот») танзим кунед.\n"
                "• Дар пойгоҳи додаҳо танҳо метрикаҳои объективии рақамӣ бидуни ташхис нигоҳ дошта мешаванд.\n\n"
                "💡 Агар саволе ба маъмур дошта бошед, нависед: «Ба маъмур гузаронед»."
            )
        if lang == "en":
            return (
                "**Privacy and Data Protection in SIHAT:**\n\n"
                "• The platform adheres strictly to the Explicit Consent principle.\n"
                "• Test results are stored only when you explicitly click 'Save Result'.\n"
                "• You can configure auto-saving anytime in Profile -> Settings.\n"
                "• Only raw objective performance metrics are stored; no medical diagnoses are ever made.\n\n"
                "💡 If you want to talk to an administrator, simply type 'Call admin' in this chat."
            )
        return (
            "**Конфиденциальность и хранение данных в SIHAT:**\n\n"
            "• Платформа работает по принципу явного согласия (Explicit Consent).\n"
            "• Результаты тестов сохраняются в базе **только если вы нажмёте кнопку «Сохранить результат»**.\n"
            "• Вы можете настроить автосохранение в Личном кабинете (раздел «Настройки»).\n"
            "• В истории сохраняются только объективные метрики без клинических диагнозов.\n\n"
            "💡 Если у вас есть вопрос к администрации, напишите в чат: «Позовите человека»."
        )

    # 5. PDF Export
    if any(k in low for k in ["pdf", "экспорт", "скачать отч", "распечат", "гузориш", "содирот"]):
        if lang == "tj":
            return (
                "**Содироти ҳисобот ба PDF:**\n\n"
                "• Пас аз анҷоми ҳар як машқ ё дар Утоқи шахсӣ тугмаи «Боргирии PDF»-ро пахш намоед.\n"
                "• Ба ҳисобот диаграммаҳо, метрикаҳои аниқ ва муқоиса бо меъёрҳои илмӣ дохил карда мешаванд.\n\n"
                "💡 Агар ба маъмур ниёз дошта бошед, нависед: «Ба маъмур гузаронед»."
            )
        if lang == "en":
            return (
                "**Exporting Reports to PDF:**\n\n"
                "• After finishing any exercise or in your Personal Profile, click 'Download PDF Report'.\n"
                "• The protocol includes graphs, raw sensory/cognitive scores, methodology passport, and reference comparisons.\n\n"
                "💡 If you need help from an administrator, simply write: 'Call admin'."
            )
        return (
            "**Экспорт отчётов в PDF:**\n\n"
            "• После завершения любого упражнения или в Личном кабинете нажмите «Скачать отчёт PDF».\n"
            "• В отчёт включаются графики, сырые метрики, паспорт методики и сравнение с референтными нормами.\n\n"
            "💡 Если нужна помощь администратора, напишите в чат: «Позовите человека»."
        )

    # 6. General Greetings
    if any(k in low for k in ["привет", "здравствуй", "салом", "добрый день", "добрый вечер", "hello", "hi"]):
        if lang == "tj":
            return (
                "Салом! Ман ёвари зеҳнии сунъии (AI) хадамоти дастгирии SIHAT ҳастам.\n\n"
                "Ман омодаам ба саволҳои шумо оид ба 15 машқҳои платформа (таваҷҷӯҳ, хотира, аксуламал, шунавоӣ ва биниш), сабти натиҷаҳо ва содироти ҳисоботҳои PDF посух диҳам.\n\n"
                "Ба шумо чӣ кӯмак карда метавонам?\n\n"
                "💡 Агар ба шумо маъмури зинда лозим бошад, танҳо дар чат нависед: «Ба маъмур гузаронед» ё «Бо одам пайваст кунед»."
            )
        if lang == "en":
            return (
                "Hello! I am the SIHAT AI First-Line Support Assistant.\n\n"
                "I am here to answer your questions regarding 15 cognitive screening exercises (attention, memory, reaction time, hearing, vision), saving results, and PDF reporting.\n\n"
                "How can I help you today?\n\n"
                "💡 If you need to speak with a human administrator, simply write 'Call admin' or 'Talk to human' directly in this chat."
            )
        return (
            "Здравствуйте! Я ИИ-ассистент первой линии платформы SIHAT.\n\n"
            "Я готов ответить на ваши вопросы по 15 упражнениям скрининга (внимание, память, реакция, слух, зрение), сохранению результатов или экспорту отчётов в PDF.\n\n"
            "Чем я могу вам помочь?\n\n"
            "💡 Если вам требуется связь с живым администратором, просто напишите в чат: «Позовите админа» или «Нужен человек»."
        )

    # 7. Short or unclear query
    if len(clean_text(text)) < 5 or bool(re.match(r"^[a-zA-Zа-яА-Я0-9\s,\.]+$", text) and len(text.split()) <= 2):
        if lang == "tj":
            return (
                "Салом! Ман ёвари зеҳнии хадамоти дастгирии SIHAT ҳастам.\n\n"
                "Лутфан саволи худро муфассалтар нависед (масалан: чӣ тавр машқи Шультеро гузарам, чӣ гуна натиҷаро сабт кунам ё PDF-ро боргирӣ намоям).\n\n"
                "💡 Агар хоҳед, ки бо мудири платформа суҳбат кунед, танҳо дар чат нависед: «Ба маъмур гузаронед»."
            )
        if lang == "en":
            return (
                "Hello! I am the SIHAT Support AI Assistant.\n\n"
                "Could you please specify your question in more detail (e.g. how to take the Schulte test, how to save results, or export PDF reports)?\n\n"
                "💡 If you would like to connect with a human administrator, simply write 'Call admin' in this chat."
            )
        return (
            "Здравствуйте! Я ИИ-ассистент службы поддержки SIHAT.\n\n"
            "Уточните, пожалуйста, ваш вопрос подробнее (например: как пройти тест Шульте, как сохранить результаты или скачать PDF).\n\n"
            "💡 Если вы хотите связаться с живым администратором платформы, напишите в чат: «Позовите человека»."
        )

    return None


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
        if lang == "tj":
            return (
                True,
                "Ҷавоби худкори поя",
                "Салом! Барои муроҷиат ба хадамоти дастгирии SIHAT ташаккур.\n\n"
                "SIHAT — платформаи интерактивӣ барои скрининги илмии қобилиятҳои маърифатӣ ва эҳсосӣ (15 машқ оид ба таваҷҷӯҳ, хотира, аксуламал, шунавоӣ ва биниш) мебошад. Платформа ташхиси клиникӣ намегузораз.\n\n"
                "💡 Агар саволи шумо иштироки маъмурро талаб кунад, дар чат нависед: «Ба маъмур гузаронед»."
            )
        if lang == "en":
            return (
                True,
                "Basic AI response",
                "Hello! Thank you for contacting SIHAT platform support.\n\n"
                "SIHAT is an interactive platform for evidence-based screening of cognitive and sensory functions (15 exercises covering attention, memory, reaction, hearing, and vision). Please note that the platform does not provide clinical diagnoses.\n\n"
                "💡 If your inquiry requires staff assistance, simply type: 'Call admin' in this chat."
            )
        return (
            True,
            "Базовый автоответ",
            "Здравствуйте! Благодарим за обращение в службу поддержки SIHAT.\n\n"
            "SIHAT — интерактивная платформа для научно обоснованного скрининга когнитивных и сенсорных способностей (15 упражнений на внимание, память, реакцию, слух и зрение). Обратите внимание: платформа не ставит клинических диагнозов.\n\n"
            "Вы можете изучить методики в «Паспорте методик» или начать тестирование из каталога.\n\n"
            "💡 Если ваш вопрос требует участия специалиста, просто напишите в этот чат: «Позовите админа»."
        )

    system_prompt = (
        "Вы — официальный ИИ-ассистент первой линии службы поддержки HealthTech платформы SIHAT.\n"
        "SIHAT включает 15 научно обоснованных упражнений (Шульте, Струп, Корси, Тахистоскоп, Двойная переработка, Реакция на свет/звук, Звуковой порог, Поле зрения, Контрастность Габора, Тремор, Пинч-захват, Координация).\n"
        "SIHAT предоставляет скрининг и самоконтроль, НЕ ставит диагнозов.\n"
        "Правила:\n"
        "1. ЯЗЫК ОТВЕТА: Строго тот же язык, на котором пишет пользователь: таджикский ('" + lang + "' == 'tj'), английский ('" + lang + "' == 'en') или русский ('" + lang + "' == 'ru').\n"
        "2. 'is_simple': true — если вопрос касается работы тестов, нахождения результатов, скачивания PDF, приватности, паспортов методик, общих вопросов платформы.\n"
        "   В этом случае дайте исчерпывающий, вежливый, четкий ответ. В конце обязательно добавьте подсказку, как позвать администратора текстом (например: '💡 Если вам потребуется помощь человека, напишите в чат: «Позовите админа»' / '💡 Агар ба маъмур ниёз доред, нависед: «Ба маъмур гузаронед»' / '💡 If you need human help, write «Call admin»').\n"
        "3. 'is_simple': false — если пользователь просит позвать человека/администратора/оператора, либо сообщает о баге, падении сайта, взломе или блокировке.\n"
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
    if lang == "tj":
        return (
            True,
            "Машварати хадамоти дастгирӣ",
            "Салом! Ман ёвари зеҳнии платформаи SIHAT ҳастам. Омодаам ба шумо дар гузаштани машқҳо, сабти натиҷаҳо ё содироти ҳисоботи PDF кӯмак кунам.\n\n"
            "💡 Агар ба шумо посухи инфиродии маъмур лозим бошад, танҳо дар чат нависед: «Ба маъмур гузаронед»."
        )
    if lang == "en":
        return (
            True,
            "Support Consultation",
            "Hello! I am the SIHAT AI Assistant. I am ready to help you with cognitive exercises, saving your results, or exporting PDF reports.\n\n"
            "💡 If you need an individual response from an administrator, simply write 'Call admin' directly in this chat."
        )
    return (
        True,
        "Консультация службы поддержки",
        "Здравствуйте! Я ИИ-ассистент платформы SIHAT. Готов помочь вам с прохождением когнитивных упражнений, сохранением результатов или экспортом PDF-отчётов.\n\n"
        "💡 Если вам требуется индивидуальный ответ администратора, просто напишите в чат: «Позовите человека»."
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
      marks needs_human=True, sends escalation handoff, and broadcasts to admin in real time.
    - Otherwise, generates helpful AI response in the user's language (TJ, RU, EN).
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
    sender_title = "Ёрдамчии AI SIHAT" if lang == "tj" else ("AI Assistant SIHAT" if lang == "en" else "ИИ-ассистент SIHAT")
    ai_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="ai",
        sender_id=None,
        sender_name=sender_title,
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
