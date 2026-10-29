"""Small server-side Gemini adapter; it stores no dialog data."""

import asyncio
import json
import logging
from typing import Any

import httpx

from sihat.config import Settings

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are SIHAT's smart, empathetic, and human-like health tech AI companion and platform navigator.
SIHAT is an open, evidence-based cognitive and sensory screening platform ("Understand Your Health" / «Пойми своё здоровье»).
SIHAT offers 15 interactive scientific exercises measuring attention, memory, processing speed, visual perception, hearing, and motor coordination.

CORE PERSONALITY & TONE:
1. Speak naturally, warmly, and intelligently like a knowledgeable human specialist, NOT a repetitive robotic disclaimer bot.
2. Maintain natural dialogue and small talk:
   - If the user says hello, asks "how are you", "who are you", or "what is this site" ("что это за сайт"):
     Reply warmly, engagingly, and conversationally! Explain SIHAT in clear, interesting, friendly terms.
   - Do NOT dump rigid clinical disclaimers on simple greetings or basic questions.
3. SIHAT is an educational self-monitoring tool, not a doctor. If a user asks for medical diagnoses, prescriptions, or emergency help, kindly advise consulting a licensed physician or calling emergency services (103/112).
4. CRITICAL LANGUAGE REQUIREMENT:
   Always respond in the EXACT SAME language the user writes:
   - Russian -> fluent, natural, friendly Russian.
   - Tajik (Тоҷикӣ) -> natural, respectful, fluent Tajik.
   - English -> clear, natural, engaging English.
   NEVER mix languages.

5. OUTPUT FORMAT:
   Return strictly valid JSON:
   {
     "message": "your natural, engaging, substantive answer",
     "actions": [optional list of UI actions]
   }

AVAILABLE UI ACTIONS (when relevant to what the user asks):
- Recommend an exercise: {"name": "open_test", "arguments": {"slug": "<slug>", "title": "<Localized Title>"}}
  Approved slugs:
  • attention-concentration — Schulte Tables (5×5) / Таблицы Шульте / Ҷадвалҳои Шулте
  • attention-switching — Trail Making (1→A→2→B) / Переключение внимания / Гузариши диққат
  • visual-memory — Corsi Blocks / Блоки Корси / Блокҳои Корси
  • short-term-memory — Digit Span / Память на цифры / Хотираи рақамӣ
  • information-processing-speed — Symbol-Digit Substitution / Скорость обработки информации
  • contrast-sensitivity — Contrast Sensitivity / Контрастная чувствительность / Ҳассосияти контрастӣ
  • visual-pairs — Visual Pairs / Визуальные пары / Ҷуфтҳои визуалӣ
  • path-memory — Route Memory / Запомни маршрут / Масирро дар хотир гир
  • pattern-matrix — Pattern Sequence / Продолжи последовательность / Пайдарпайиро давом деҳ
  • sound-discrimination — Sound Pitch Discrimination / Сравнение звуков / Муқоисаи овозҳо
  • speech-in-noise — Speech in Noise / Речь в шуме / Фаҳмоии нутқ дар садо
  • reaction-speed — Simple Reaction Speed / Скорость простой реакции / Суръати вокуниш
  • go-no-go — Go/No-Go Inhibitory Control / Торможение импульса / Боздории импулс
  • mouse-eye-coordination — Pursuit Tracking / Слежение за целью / Пайгирии ҳадаф
  • cursor-path — Steering Corridor / Точный маршрут курсора / Идораи траектория
- Open Catalog: {"name": "navigate_to_page", "arguments": {"target": "/catalog"}}
- Open Methodologies: {"name": "navigate_to_page", "arguments": {"target": "/methodologies"}}
"""

DEFAULT_MODELS = [
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
]


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
    except (KeyError, IndexError, TypeError, ValueError):
        # Fallback: if Gemini gave raw text without strict JSON wrapping, extract as message
        try:
            raw_text = payload["candidates"][0]["content"]["parts"][0]["text"].strip()
            if raw_text:
                return {"message": raw_text, "actions": []}
        except Exception as exc:
            raise GeminiUnavailableError(f"Malformed Gemini payload: {exc}") from exc
        raise GeminiUnavailableError("Malformed Gemini payload: missing text") from None

    if not isinstance(result, dict) or "message" not in result:
        if isinstance(result, dict) and "text" in result:
            return {"message": str(result["text"]), "actions": result.get("actions", [])}
        raise GeminiUnavailableError("Malformed Gemini payload: missing message")
    return result


def _get_model_candidates(configured_model: str | None) -> list[str]:
    res: list[str] = []
    if configured_model and configured_model.strip():
        res.append(configured_model.strip())
    for m in DEFAULT_MODELS:
        if m not in res:
            res.append(m)
    return res


async def generate_assistant_response_async(
    *,
    settings: Settings,
    conversation: list[dict[str, str]],
    shared_results: list[dict[str, object]],
    api_key: str | None = None,
) -> dict[str, Any]:
    """Asynchronously generate responses via Gemini API with httpx and automatic model fallback."""
    active_key = api_key or (
        settings.gemini_api_key.get_secret_value() if settings.gemini_is_configured else None
    )
    if not active_key:
        raise GeminiUnavailableError("Gemini is not configured")

    contents = _prepare_gemini_payload(conversation, shared_results)
    candidate_models = _get_model_candidates(settings.gemini_model)

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=18.0) as client:
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                response = await client.post(
                    url,
                    params={"key": active_key},
                    json={
                        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                        "contents": contents,
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "maxOutputTokens": 1200,
                        },
                    },
                )
                if response.status_code in (404, 503, 429) and model != candidate_models[-1]:
                    logger.warning(
                        "Gemini model %s returned status %d, trying next candidate...",
                        model,
                        response.status_code,
                    )
                    continue
                response.raise_for_status()
                payload = response.json()
                return _parse_gemini_response(payload)
            except (httpx.HTTPError, GeminiUnavailableError) as exc:
                last_error = exc
                if model != candidate_models[-1]:
                    continue

    raise GeminiUnavailableError(str(last_error) if last_error else "All Gemini models failed")


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
        active_key = api_key or (
            settings.gemini_api_key.get_secret_value() if settings.gemini_is_configured else None
        )
        if not active_key:
            raise GeminiUnavailableError("Gemini is not configured")
        contents = _prepare_gemini_payload(conversation, shared_results)
        candidate_models = _get_model_candidates(settings.gemini_model)
        last_error: Exception | None = None
        with httpx.Client(timeout=18.0) as client:
            for model in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                try:
                    response = client.post(
                        url,
                        params={"key": active_key},
                        json={
                            "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                            "contents": contents,
                            "generationConfig": {
                                "responseMimeType": "application/json",
                                "maxOutputTokens": 1200,
                            },
                        },
                    )
                    if response.status_code in (404, 503, 429) and model != candidate_models[-1]:
                        continue
                    response.raise_for_status()
                    return _parse_gemini_response(response.json())
                except (httpx.HTTPError, GeminiUnavailableError) as exc:
                    last_error = exc
                    if model != candidate_models[-1]:
                        continue
        raise GeminiUnavailableError(str(last_error) if last_error else "All Gemini models failed")
    else:
        return asyncio.run(
            generate_assistant_response_async(
                settings=settings,
                conversation=conversation,
                shared_results=shared_results,
                api_key=api_key,
            )
        )
