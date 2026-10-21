"""
Gnani / Vachana TTS Wrapper using official gnani-vachana SDK.
Handles Text-to-Speech synthesis via GnaniTTSClient using timbre-v2.5.
"""
import asyncio
from gnani.tts import GnaniTTSClient, AudioConfig
from backend.config import settings

_client: GnaniTTSClient | None = None

VOICE_MAP = {
    "female": "Kaveri",
    "male": "Pranav",
    "hinglish": "Poorvi",
}


def _get_client() -> GnaniTTSClient:
    global _client
    if _client is None:
        _client = GnaniTTSClient(api_key=settings.gnani_api_key)
    return _client


async def synthesize_speech(
    text: str,
    language: str = "en-IN",
    voice: str = "female",
    speed: float = 1.0,
) -> bytes:
    """
    Send text to Gnani TTS and return audio bytes (WAV format).

    Args:
        text: Text to synthesize.
        language: BCP-47 tag (e.g. 'en-IN', 'hi-IN', 'auto').
        voice: Voice name (e.g. 'Kaveri', 'Pranav', 'Poorvi', or 'female'/'male').
        speed: Speed multiplier between 0.85 and 1.15.

    Returns:
        Raw WAV bytes.
    """
    client = _get_client()

    # Determine voice
    selected_voice = VOICE_MAP.get(voice.lower(), voice)
    # If hinglish mode, prioritize Poorvi
    if language == "hi-IN" and selected_voice in {"Kaveri", "Pranav"}:
        selected_voice = "Poorvi"

    cfg = AudioConfig(sample_rate=48000, encoding="linear_pcm", container="wav")

    # Run synchronous SDK call in an executor thread
    audio_bytes = await asyncio.to_thread(
        client.synthesize,
        text=text,
        voice=selected_voice,
        model="timbre-v2.5",
        language=language,
        speed=speed,
        audio_config=cfg,
    )
    return audio_bytes
