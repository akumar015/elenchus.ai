"""
Gnani / Vachana TTS Service using Gnani Timbre v3.0 REST API.
Handles Text-to-Speech synthesis with Shivani (Hinglish/hi-IN) and Kalpana (English/en-IN).
"""
import asyncio
import requests
from gnani.tts import GnaniTTSClient
from backend.config import settings

_client: GnaniTTSClient | None = None

VOICE_MAP = {
    "female": "Kalpana",
    "male": "Avinash",
    "hinglish": "Shivani",
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
    resp = requests.post(TTS_ENDPOINT, headers=headers, json=payload, timeout=60)
    if resp.status_code != 200:
        raise RuntimeError(f"Gnani TTS v3.0 failed with status {resp.status_code}: {resp.text}")
    return resp.content


async def synthesize_speech(
    text: str,
    language: str = "en-IN",
    voice: str = "female",
    speed: float = 1.0,
) -> bytes:
    """
    Send text to Gnani TTS v3.0 and return audio bytes (WAV format).

    Args:
        text: Text to synthesize.
        language: BCP-47 tag (e.g. 'en-IN', 'hi-IN').
        voice: Voice name (e.g. 'Kalpana', 'Shivani', 'Avinash').
        speed: Speed multiplier.

    Returns:
        Raw WAV bytes.
    """
    selected_voice = VOICE_MAP.get(voice.lower(), voice)

    # Route default voices per language
    if language == "hi-IN":
        selected_voice = "Shivani"
    elif language == "en-IN" and selected_voice in {"Kalpana", "Poorvi", "Kaveri", "female"}:
        selected_voice = "Kalpana"

    payload = {
        "text": text,
        "voice": selected_voice,
        "model": "timbre-v3.0",
        "language": language,
        "speed": speed,
        "audio_config": {
            "sample_rate": 48000,
            "encoding": "linear_pcm",
            "container": "wav",
        },
    }

    # Run in executor thread to not block the async event loop
    return await asyncio.to_thread(_synthesize_sync, payload)
