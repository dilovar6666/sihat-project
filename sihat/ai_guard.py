"""AI Safety & Adversarial Query Guard.
Detects suspicious, adversarial, and policy-violating prompts directed at the clinical AI assistant.
"""

import re
from typing import TypedDict


class SuspicionResult(TypedDict):
    is_suspicious: bool
    category: str
    reason: str
    severity: str


# 1. Prompt Injections & Jailbreaks
_PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+.*?(instructions|rules|prompts|guidelines)",
    r"disregard\s+.*?(instructions|rules|prompts)",
    r"forget\s+.*?(instructions|rules|prompts)",
    r"(dan|unrestricted|godmode|jailbreak|jailbroken|evil)\s+mode",
    r"you\s+are\s+now\s+(dan|unrestricted|godmode|jailbroken|evil)",
    r"act\s+as\s+(dan|unrestricted|jailbroken|an\s+ai\s+without\s+rules)",
    r"developer\s+mode",
    r"system\s+prompt",
    r"(reveal|print|show|output|leak|display)\s+.*?(system\s+prompt|instructions|initial\s+prompt|guidelines|hidden\s+rules|system\s+instructions)",
    r"bypass\s+(safety|content\s+filter|all\s+filters|restrictions)",
    r"override\s+(safety|guidelines|all\s+rules)",
    # Russian patterns
    r"забудь\s+.*?(инструкции|правила|указания|промпт)",
    r"игнорируй\s+.*?(инструкции|правила|ограничения|промпт)",
    r"(покажи|выведи|раскрой|скажи)\s+.*?(системный\s+промпт|начальные\s+инструкции|скрытые\s+правила|инструкци|промпт)",
    r"режим\s+(разработчика|dan|бога|без\s+ограничений)",
    r"обойти\s+(фильтр|защиту|ограничения)",
    r"ты\s+теперь\s+(dan|без\s+ограничений)",
    # Tajik patterns
    r"дастурҳоро\s+фаромӯш\s+кун",
    r"қоидаҳоро\s+фаромӯш\s+кун",
    r"промпти\s+системавиро\s+нишон\s+деҳ",
]

# 2. Harmful / Dangerous / Illegal / Weapons / Drugs / Cyberattacks
_HARMFUL_PATTERNS = [
    r"(how\s+to|instructions\s+for)\s+(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)",
    r"(synthesize|cook|produce)\s+(meth|drugs|fentanyl|heroin|poison)",
    r"(ways|how)\s+to\s+(kill\s+myself|commit\s+suicide)",
    r"(hack|exploit|ddos|sql\s+inject)\s+(into\s+)?(website|database|server)",
    r"steal\s+(credit\s+cards|passwords|credentials)",
    # Russian patterns
    r"(как\s+)?(сделать|собрать|изготовить)\s+(бомбу|взрывчатку|взрывное\s+устройство|оружие)",
    r"(как\s+)?(сварить|синтезировать|приготовить)\s+(мефедрон|наркотик|яд|фентанил)",
    r"(способы|как)\s+(совершить\s+самоубийство|убить\s+себя|покончить\s+с\s+собой)",
    r"(взлом|взломать|хакнуть)\s+(сайт|базу\s+данных|сервер|аккаунт|пароли)",
    r"(sql\s+инъекция|ddos\s+атака|кража\s+паролей|украсть\s+карты)",
    # Tajik patterns
    r"сохтани\s+(бомба|маводи\s+мухаддир)",
    r"худкушӣ|куштани\s+худ",
    r"хакерӣ|ҳакерӣ|взлом\s+кардан",
]

_COMPILED_INJECTION = [re.compile(p, re.IGNORECASE) for p in _PROMPT_INJECTION_PATTERNS]
_COMPILED_HARMFUL = [re.compile(p, re.IGNORECASE) for p in _HARMFUL_PATTERNS]


def classify_ai_request(text: str) -> SuspicionResult | None:
    if not text:
        return None
    raw = text.strip()

    # 1. Check for prompt injection / jailbreak attempts
    for pattern in _COMPILED_INJECTION:
        if pattern.search(raw):
            return {
                "is_suspicious": True,
                "category": "prompt_injection",
                "reason": "Попытка взлома или извлечения системного промпта / обхода ограничений (Prompt Injection / Jailbreak)",
                "severity": "high",
            }

    # 2. Check for harmful / dangerous / illegal topics
    for pattern in _COMPILED_HARMFUL:
        if pattern.search(raw):
            return {
                "is_suspicious": True,
                "category": "harmful_content",
                "reason": "Запрос на опасную или незаконную тему (оружие, наркотики, вредоносное ПО, суицид)",
                "severity": "critical",
            }

    # 3. Check for obvious SQL injection probes inside prompt text
    low = raw.lower()
    if any(sql in low for sql in ["' or '1'='1", "union select", "drop table", "; drop database", "exec(xp_cmdshell"]):
        return {
            "is_suspicious": True,
            "category": "prompt_injection",
            "reason": "Попытка внедрения SQL-команд в запрос к ассистенту",
            "severity": "critical",
        }

    return None
