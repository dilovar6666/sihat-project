"""Small server-side Gemini adapter; it stores no dialog data."""

import asyncio
import json
from typing import Any

import httpx

from sihat.config import Settings

SYSTEM_INSTRUCTION = """You are SIHAT's clinical and navigation AI assistant.
SIHAT is an evidence-based self-monitoring and cognitive-sensory screening platform.
SIHAT does not diagnose medical conditions or prescribe medications.

CRITICAL LANGUAGE REQUIREMENT:
You MUST ALWAYS detect the language of the user's latest query (Russian, Tajik, or English)
and reply in the EXACT SAME language:
- If the user writes in Russian -> answer completely in natural, helpful, professional Russian.
- If the user writes in Tajik -> answer completely in fluent, respectful, natural Tajik (Тоҷикӣ).
- If the user writes in English -> answer completely in clear, natural English.
NEVER mix languages. Never insert random English disclaimers into Russian or Tajik text.

CONVERSATIONAL GUIDELINE:
Do not answer with repetitive canned disclaimers or robotic templates!
Directly answer what the user is asking.
If the user asks "what do I need" / "что мне надо" / "ба ман чи лозим":
Helpfully break down options by their symptoms or goals (eye fatigue -> vision test; lack of focus -> Schulte tables; reflexes -> reaction speed; stress -> GAD-7) and guide them to start a test.

Return JSON only:
{"message": "substantive helpful response", "actions": [{"name": "...", "arguments": {}}]}.

When recommending a specific test, include an action with name "open_test"
and arguments {"slug": "<slug>", "title": "<Localized Test Title>"}.
Available test slugs and titles:
- visual-perception: Visual Acuity Landolt C / Острота зрения / Тезиши биноӣ
- contrast-sensitivity: Contrast Sensitivity Pelli-Robson / Контрастная чувствительность / Ҳассосияти контрастӣ
- color-perception: Color Blindness Screening / Тест на дальтонизм / Санҷиши дальтонизм
- sound-discrimination: Pure Tone Audiometry / Тональная аудиометрия / Аудиометрияи тоналӣ
- speech-in-noise: Speech-in-Noise Discrimination / Разборчивость речи в шуме / Фаҳмоии нутқ дар садо
- attention-concentration: Schulte Attention Tables 5x5 / Таблицы Шульте / Ҷадвалҳои Шулте
- reaction-speed: Simple Reaction Speed / Скорость простой реакции / Суръати аксуламал
- short-term-memory: Short-Term Memory Digit Span / Кратковременная память / Хотираи кӯтоҳмуддат
- gad-7: Generalized Anxiety Scale / Шкала тревожности GAD-7 / Миқёси ташвиш GAD-7
- daily-activity: Circadian Profile / Циркадианный ритм / Ритми сиркадӣ

If general browsing is requested, use action name "navigate_to_page" with arguments {"target": "/catalog"}.
Actions must be limited to the supplied allowlist. Never propose save, export, delete,
answer-submission, consent, or arbitrary code actions."""


class GeminiUnavailableError(RuntimeError):
    pass


def _prepare_gemini_payload(
    conversation: list[dict[str, str]],
    shared_results: list[dict[str, object]],
) -> list[dict[str, Any]]:
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
    return contents


def _parse_gemini_response(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        raw_text = payload["candidates"][0]["content"]["parts"][0]["text"].strip()
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_text = "\n".join(lines).strip()
        result = json.loads(raw_text)
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise GeminiUnavailableError(f"Malformed Gemini payload: {exc}") from exc

    if not isinstance(result, dict) or "message" not in result:
        raise GeminiUnavailableError("Malformed Gemini payload: missing message")
    return result


async def generate_assistant_response_async(
    *,
    settings: Settings,
    conversation: list[dict[str, str]],
    shared_results: list[dict[str, object]],
    api_key: str | None = None,
) -> dict[str, Any]:
    """Asynchronously generate responses via Gemini API with httpx."""
    active_key = api_key or (
        settings.gemini_api_key.get_secret_value() if settings.gemini_is_configured else None
    )
    if not active_key:
        raise GeminiUnavailableError("Gemini is not configured")

    contents = _prepare_gemini_payload(conversation, shared_results)
    model = settings.gemini_model or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
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
            )
            response.raise_for_status()
            payload = response.json()
            return _parse_gemini_response(payload)
    except httpx.HTTPError as exc:
        raise GeminiUnavailableError(str(exc)) from exc


def generate_assistant_response(
    *,
    settings: Settings,
    conversation: list[dict[str, str]],
    shared_results: list[dict[str, object]],
    api_key: str | None = None,
) -> dict[str, Any]:
    """Synchronous fallback/compatibility wrapper."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # In an active event loop, run synchronously using httpx.Client
        active_key = api_key or (
            settings.gemini_api_key.get_secret_value() if settings.gemini_is_configured else None
        )
        if not active_key:
            raise GeminiUnavailableError("Gemini is not configured")
        contents = _prepare_gemini_payload(conversation, shared_results)
        model = settings.gemini_model or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
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
                )
                response.raise_for_status()
                return _parse_gemini_response(response.json())
        except httpx.HTTPError as exc:
            raise GeminiUnavailableError(str(exc)) from exc
    else:
        return asyncio.run(
            generate_assistant_response_async(
                settings=settings,
                conversation=conversation,
                shared_results=shared_results,
                api_key=api_key,
            )
        )
