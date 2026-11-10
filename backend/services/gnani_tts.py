"""
Gnani / Vachana TTS Service using Gnani Timbre v3.0 REST API.
Handles Text-to-Speech synthesis with Shivani (Hinglish/hi-IN) and Kalpana (English/en-IN).
"""
import asyncio
import time
import requests
from gnani.tts import GnaniTTSClient
from backend.config import settings

_client: GnaniTTSClient | None = None
_tts_lock = asyncio.Lock()

VOICE_MAP = {
    "female": "Kalpana",
    "male": "Avinash",
    "hinglish": "Shivani",
    "punjabi": "Tarika",
    "telugu": "Lakshmi",
}

TTS_ENDPOINT = "https://api.vachana.ai/api/v1/tts/inference"


def _get_client() -> GnaniTTSClient:
    """Retained for startup pre-warming / backward compatibility."""
    global _client
    if _client is None:
        _client = GnaniTTSClient(api_key=settings.gnani_api_key)
    return _client


def _synthesize_sync(payload: dict) -> bytes:
    headers = {
        "X-API-Key-ID": settings.gnani_api_key,
        "Content-Type": "application/json",
    }
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            resp = requests.post(TTS_ENDPOINT, headers=headers, json=payload, timeout=60)
            if resp.status_code == 200:
                return resp.content
            # If server returned transient 5xx or rate limit, retry with backoff
            if resp.status_code in {429, 500, 502, 503, 504} and attempt < max_retries:
                time.sleep(0.7 * (attempt + 1))
                continue
            raise RuntimeError(f"Gnani TTS v3.0 failed with status {resp.status_code}: {resp.text}")
        except requests.RequestException as e:
            if attempt < max_retries:
                time.sleep(0.7 * (attempt + 1))
                continue
            raise RuntimeError(f"Gnani TTS v3.0 network error: {e}") from e
    raise RuntimeError("Gnani TTS v3.0 failed after retries.")


async def synthesize_speech(
    text: str,
    language: str = "en-IN",
    voice: str = "female",
    speed: float = 1.0,
) -> bytes:
    """
    Send text to Gnani TTS v3.0 and return audio bytes (WAV format).
    Uses an asyncio.Lock to strictly respect Gnani's 1-active-request concurrency limit.

    Args:
        text: Text to synthesize.
        language: BCP-47 tag (e.g. 'en-IN', 'hi-IN').
        voice: Voice name (e.g. 'Kalpana', 'Shivani', 'Avinash').
        speed: Speed multiplier.

    Returns:
        Raw WAV bytes.
    """
    selected_voice = VOICE_MAP.get(voice.lower(), voice)

    # Route default voices per language (preserve explicit Avinash / male across all languages)
    if selected_voice in {"Avinash", "male"}:
        selected_voice = "Avinash"
    elif selected_voice in {"Kaveri", "Lakshmi"}:
        selected_voice = "Lakshmi"
    elif selected_voice == "Tarika":
        selected_voice = "Tarika"
    elif selected_voice in {"Shivani", "Kalpana"}:
        selected_voice = selected_voice
    elif language == "hi-IN":
        selected_voice = "Shivani"
    elif language == "pa-IN":
        selected_voice = "Tarika"
    elif language == "te-IN":
        selected_voice = "Lakshmi"
    else:
        selected_voice = "Kalpana"

    payload = {
        "text": text,
        "voice": selected_voice,
        "model": "timbre-v3.0",
        "language": language,
        "speed": speed,
        "audio_config": {
            "sample_rate": 24000,
            "encoding": "linear_pcm",
            "container": "wav",
        },
    }

    # Run in executor thread to not block the async event loop
    async with _tts_lock:
        return await asyncio.to_thread(_synthesize_sync, payload)
