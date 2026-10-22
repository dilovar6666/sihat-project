"""Small server-side Gemini adapter; it stores no dialog data."""

import json
from typing import Any

import requests

from sihat.config import Settings

SYSTEM_INSTRUCTION = """You are SIHAT's navigation and information assistant.
SIHAT does not diagnose conditions, prescribe treatment, or change medical scoring.
Use only the current conversation supplied in this request. Do not claim to have access
to account data unless explicitly included as shared result context. Return JSON only:
{"message": "short safe answer", "actions": [{"name": "...", "arguments": {}}]}.
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
) -> dict[str, Any]:
    if not settings.gemini_is_configured:
        raise GeminiUnavailableError("Gemini is not configured")
    contents = [
        {
            "role": "model" if message["role"] == "assistant" else "user",
            "parts": [{"text": message["text"]}],
        }
        for message in conversation
    ]
    if shared_results:
        contents.append(
            {
                "role": "user",
                "parts": [
                    {
                        "text": "The user explicitly shared these private result summaries: "
                        + json.dumps(shared_results, ensure_ascii=False)
                    }
                ],
            }
        )
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
    try:
        response = requests.post(
            url,
            params={"key": settings.gemini_api_key.get_secret_value()},
            json={
                "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                "contents": contents,
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "maxOutputTokens": 600,
                },
            },
            timeout=12,
        )
        response.raise_for_status()
        payload = response.json()
        text = payload["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(text)
    except (KeyError, IndexError, TypeError, ValueError, requests.RequestException) as exc:
        raise GeminiUnavailableError("Gemini request failed") from exc
    if not isinstance(result, dict):
        raise GeminiUnavailableError("Gemini returned an invalid response")
    return result
