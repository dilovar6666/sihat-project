"""Small server-side Gemini adapter; it stores no dialog data."""

import json
from typing import Any

import requests

from sihat.config import Settings

SYSTEM_INSTRUCTION = """You are SIHAT's navigation and clinical information assistant.
SIHAT does not diagnose conditions, prescribe treatment, or change medical scoring.
Use only the current conversation supplied in this request. Do not claim to have access
to account data unless explicitly included as shared result context. Return JSON only:
{"message": "short safe answer", "actions": [{"name": "...", "arguments": {}}]}.

When the user asks how to check their hearing, vision, color perception, attention, or reaction,
recommend the specific clinical screening test and include an action with name "open_test"
and arguments {"slug": "<slug>", "title": "<Test Title>"}.
Available test slugs and titles:
- sound-discrimination: Pure Tone Audiometry 250–8000 Hz / Тональная аудиометрия (hearing / слух)
- speech-in-noise: Speech-in-Noise Discrimination / Разборчивость речи в шуме
- visual-perception: Visual Acuity Landolt C / Острота зрения (vision / зрение)
- color-perception: Color Blindness Screening Rabkin & Ishihara / Тест на дальтонизм (цвета / дальтонизм)
- contrast-sensitivity: Contrast Sensitivity Pelli-Robson / Контрастная чувствительность
- color-hue-discrimination: Color Hue Discrimination Farnsworth D-15 / Цветоразличение оттенков
- attention-concentration: Schulte Attention Tables 5x5 / Таблицы Шульте (внимание)
- reaction-speed: Simple Reaction Speed / Скорость простой реакции
- short-term-memory: Short-Term Memory Digit Span / Кратковременная память

If general browsing is requested, use action name "navigate_to_page" with arguments {"target": "/catalog"}.
Actions must be limited to the supplied allowlist. Never propose save, export, delete,
answer-submission, consent, or arbitrary code actions. For symptoms or danger, advise
contacting local emergency services or a qualified clinician; do not diagnose."""


class GeminiUnavailableError(RuntimeError):
    pass


def generate_assistant_response(
    *,
    settings: Settings,
    conversation: list[dict[str, str]],
    shared_results: list[dict[str, object]],
    api_key: str | None = None,
) -> dict[str, Any]:
    active_key = api_key or (settings.gemini_api_key.get_secret_value() if settings.gemini_is_configured else None)
    if not active_key:
        raise GeminiUnavailableError("Gemini is not configured")

    contents: list[dict[str, Any]] = []
    for message in conversation:
        role = "model" if message.get("role") == "assistant" else "user"
        text = message.get("text", "").strip()
        if not text:
            continue
        if contents and contents[-1]["role"] == role:
            contents[-1]["parts"].append({"text": text})
        else:
            contents.append({"role": role, "parts": [{"text": text}]})

    if shared_results:
        summary_text = (
            "The user explicitly shared these private result summaries: "
            + json.dumps(shared_results, ensure_ascii=False)
        )
        if contents and contents[-1]["role"] == "user":
            contents[-1]["parts"].append({"text": summary_text})
        else:
            contents.append({"role": "user", "parts": [{"text": summary_text}]})

    model = settings.gemini_model or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    try:
        response = requests.post(
            url,
            params={"key": active_key},
            json={
                "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                "contents": contents,
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "maxOutputTokens": 1000,
                },
            },
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
        raw_text = payload["candidates"][0]["content"]["parts"][0]["text"].strip()
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_text = "\n".join(lines).strip()
        result = json.loads(raw_text)
    except (KeyError, IndexError, TypeError, ValueError, requests.RequestException) as exc:
        raise GeminiUnavailableError(f"Gemini request failed: {exc}") from exc
    if not isinstance(result, dict):
        raise GeminiUnavailableError("Gemini returned an invalid response")
    return result
