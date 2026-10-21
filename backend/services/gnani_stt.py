"""
Gnani / Vachana STT Wrapper using official gnani-vachana SDK.
Handles Speech-to-Text transcription via GnaniSTTClient.
"""
import asyncio
from gnani.stt import GnaniSTTClient
from backend.config import settings

_client: GnaniSTTClient | None = None


def _get_client() -> GnaniSTTClient:
    global _client
    if _client is None:
        _client = GnaniSTTClient(api_key=settings.gnani_api_key)
    return _client


async def transcribe_audio(audio_bytes: bytes, language: str = "en-IN") -> str:
    """
    Send audio bytes to Gnani STT and return the transcribed text.

    Args:
        audio_bytes: Raw audio bytes (WAV, MP3, etc.).
        language: BCP-47 language tag (e.g. 'en-IN', 'hi-IN').

    Returns:
        Transcribed string.
    """
    client = _get_client()
    # Gnani STT client uses synchronous requests under the hood,
    # so we run it in an async executor thread to not block the event loop.
    result = await asyncio.to_thread(
        client.transcribe_bytes,
        audio_bytes=audio_bytes,
        filename="audio.wav",
        language_code=language,
        format="transcribe",
    )
    transcript = (result.get("transcript") or "").strip()
    return transcript
