"""Seed initial non-diagnostic FAQ items and educational knowledge articles."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from sihat.models import FaqItem, KnowledgeArticle

INITIAL_FAQS: tuple[dict, ...] = (
    {
        "slug": "what-is-sihat",
        "category": "general",
        "sort_order": 1,
        "is_published": True,
        "question": {
            "ru": "Что такое платформа SIHAT?",
            "tg": "Платформаи SIHAT чист?",
            "en": "What is the SIHAT platform?",
        },
        "answer": {
            "ru": (
                "SIHAT — это HealthTech веб-платформа для ориентировочных опросников "
                "и образовательных цифровых упражнений. Она не ставит медицинских диагнозов "
                "и не назначает лечение."
            ),
            "tg": (
                "SIHAT платформаи иттилоотии HealthTech барои машқҳои рақамӣ ва пурсишномаҳои "
                "озмоишӣ мебошад. Он ташхиси тиббӣ намегузорад ва табобат таъин намекунад."
            ),
            "en": (
                "SIHAT is an educational HealthTech platform for self-reflection questionnaires "
                "and digital exercises. It does not provide medical diagnoses or prescribe "
                "treatment."
            ),
        },
    },
    {
        "slug": "privacy-and-consent",
        "category": "privacy",
        "sort_order": 2,
        "is_published": True,
        "question": {
            "ru": "Как защищена конфиденциальность моих результатов?",
            "tg": "Махфияти натиҷаҳои ман чӣ гуна ҳифз мешавад?",
            "en": "How is my privacy protected?",
        },
        "answer": {
            "ru": (
                "Результаты попыток не сохраняются в постоянную историю без вашего явного "
                "согласия (Save / Do not save). Сохранённые результаты доступны только вам, "
                "защищены от IDOR и могут быть удалены в любой момент."
            ),
            "tg": (
                "Натиҷаҳо бе розигии мустақими шумо дар таърих нигоҳ дошта намешаванд. "
                "Шумо метавонед натиҷаҳои худро дар дилхоҳ вақт нест кунед."
            ),
            "en": (
                "Attempt results are never saved to permanent history without your explicit "
                "choice (Save / Do not save). Saved results are private to your account and "
                "can be deleted at any time."
            ),
        },
    },
    {
        "slug": "no-aggregate-health-score",
        "category": "methodology",
        "sort_order": 3,
        "is_published": True,
        "question": {
            "ru": "Почему SIHAT не вычисляет общий процент здоровья?",
            "tg": "Чаро SIHAT фоизи умумии саломатиро ҳисоб намекунад?",
            "en": "Why is there no single health percentage score?",
        },
        "answer": {
            "ru": (
                "Здоровье многогранно. Объединение разнородных тестов в единую оценку "
                "ненаучно и вводит в заблуждение. SIHAT фиксирует только конкретные "
                "параметры выполнения упражнений без вымышленных шкал."
            ),
            "tg": (
                "Саломатӣ серҷабҳа аст. Якҷоя кардани санҷишҳои гуногун ба як баҳо "
                "ғайриилмӣ мебошад. SIHAT танҳо нишондиҳандаҳои воқеии иҷрои машқҳоро "
                "нишон медиҳад."
            ),
            "en": (
                "Health is multidimensional. Collapsing disparate checks into an arbitrary "
                "single score is scientifically invalid. SIHAT shows only bounded task "
                "performance metrics."
            ),
        },
    },
)

INITIAL_ARTICLES: tuple[dict, ...] = (
    {
        "slug": "methodology-passport-standards",
        "category": "standards",
        "sort_order": 1,
        "is_published": True,
        "localizations": {
            "ru": {
                "title": "Стандарты паспортов методик SIHAT",
                "summary": "Каждая методика проходит обязательную проверку источников.",
                "content": (
                    "Каждый модуль платформы SIHAT сопровождается паспортом методики, "
                    "фиксирующим происхождение, версию, ограничения устройств и доказательный "
                    "статус. Модули без лицензий и экспертной проверки не публикуются как "
                    "валидированные скрининги."
                ),
            },
            "tg": {
                "title": "Стандартҳои шиносномаи методологияи SIHAT",
                "summary": "Ҳар як методология аз санҷиши сарчашмаҳо мегузарад.",
                "content": (
                    "Ҳар як санҷиш бо шиносномаи расмӣ таъмин карда мешавад, ки сарчашма ва "
                    "маҳдудиятҳоро нишон медиҳад."
                ),
            },
            "en": {
                "title": "SIHAT Methodology Passport Standards",
                "summary": "Every methodology adheres to documented evidence sources.",
                "content": (
                    "Every screening questionnaire and digital exercise in SIHAT is bounded "
                    "by an immutable methodology passport detailing source provenance, "
                    "versioning, device limitations, and interpretation boundaries."
                ),
            },
        },
    },
    {
        "slug": "device-conditions-guidance",
        "category": "guidance",
        "sort_order": 2,
        "is_published": True,
        "localizations": {
            "ru": {
                "title": "Влияние дисплея и окружения на результаты",
                "summary": "Пользовательские экраны и освещение влияют на визуальные метрики.",
                "content": (
                    "Интерактивные упражнения в браузере зависят от частоты обновления экрана, "
                    "задержек сенсора и освещения. Они служат для образовательной самооценки и "
                    "не заменяют клиническое оборудование."
                ),
            },
            "tg": {
                "title": "Таъсири экран ва муҳит ба натиҷаҳо",
                "summary": "Экранҳо ва равшанӣ ба нишондиҳандаҳои машқҳо таъсир мерасонанд.",
                "content": (
                    "Машқҳои интерактивӣ аз хусусиятҳои дастгоҳ вобаста буда, таҷҳизоти "
                    "касбиро иваз намекунанд."
                ),
            },
            "en": {
                "title": "Display and Environmental Effects on Exercises",
                "summary": "Screen calibration, ambient lighting, and latency influence metrics.",
                "content": (
                    "Interactive browser exercises are subject to hardware latency and display "
                    "color balance. They provide cognitive reflection and exercise practice "
                    "rather than laboratory-grade clinical diagnostics."
                ),
            },
        },
    },
)


def seed_content(session: Session) -> tuple[int, int]:
    faqs_added = 0
    for faq_data in INITIAL_FAQS:
        if not session.scalar(select(FaqItem.id).where(FaqItem.slug == faq_data["slug"])):
            session.add(FaqItem(**faq_data))
            faqs_added += 1

    articles_added = 0
    for article_data in INITIAL_ARTICLES:
        if not session.scalar(
            select(KnowledgeArticle.id).where(KnowledgeArticle.slug == article_data["slug"])
        ):
            session.add(KnowledgeArticle(**article_data))
            articles_added += 1

    if faqs_added or articles_added:
        session.commit()

    return faqs_added, articles_added
