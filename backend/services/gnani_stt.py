"""
Gnani / Vachana STT Wrapper using official gnani-vachana SDK.
Handles Speech-to-Text transcription via GnaniSTTClient with automatic
chunking for long user utterances to avoid Gnani's 30-second duration limit.
"""
import asyncio
import io
import wave
from gnani.stt import GnaniSTTClient
from backend.config import settings

_client: GnaniSTTClient | None = None


def _get_client() -> GnaniSTTClient:
    global _client
    if _client is None:
        _client = GnaniSTTClient(api_key=settings.gnani_api_key)
    return _client


def _split_wav_chunks(audio_bytes: bytes, max_duration_sec: float = 24.0) -> list[bytes]:
    """
    If the audio is a valid WAV longer than max_duration_sec,
    splits it into sequential chunks (each <= max_duration_sec) so it
    stays safely under Gnani's 30-second hard limit.
    If not a WAV or parsing fails, returns [audio_bytes] as fallback.
    """
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as w:
            params = w.getparams()
            framerate = w.getframerate()
            nframes = w.getnframes()
            bytes_per_frame = params.sampwidth * params.nchannels
            if bytes_per_frame > 0:
                actual_frames = (len(audio_bytes) - 44) // bytes_per_frame
                if nframes > actual_frames or nframes > 2000000000:
                    nframes = max(0, actual_frames)
            duration = nframes / float(framerate) if framerate > 0 else 0
            if duration <= max_duration_sec:
                return [audio_bytes]

            chunk_frames = int(max_duration_sec * framerate)
            chunks: list[bytes] = []
            for start in range(0, nframes, chunk_frames):
                end = min(start + chunk_frames, nframes)
                w.setpos(start)
                data = w.readframes(end - start)
                buf = io.BytesIO()
                with wave.open(buf, "wb") as cw:
                    cw.setparams(params)
                    cw.writeframes(data)
                chunks.append(buf.getvalue())
            return chunks
    except Exception as e:
        safe_err = str(e).encode("ascii", errors="backslashreplace").decode("ascii")
        print(f"[STT WARNING] Could not parse audio as WAV for chunking: {safe_err}")
        return [audio_bytes]


async def transcribe_audio(audio_bytes: bytes, language: str = "en-IN") -> str:
    """
    Send audio bytes to Gnani STT and return the transcribed text.
    Handles long audio turns by automatically splitting into <= 24s segments.

    Args:
        audio_bytes: Raw audio bytes (WAV, MP3, etc.).
        language: BCP-47 language tag (e.g. 'en-IN', 'hi-IN').

    Returns:
        Transcribed string.
    """
    client = _get_client()
    chunks = _split_wav_chunks(audio_bytes, max_duration_sec=24.0)
    transcripts: list[str] = []

    for idx, chunk in enumerate(chunks):
        try:
            result = await asyncio.to_thread(
                client.transcribe_bytes,
                audio_bytes=chunk,
                filename=f"audio_part_{idx}.wav",
                language_code=language,
                format="transcribe",
            )
            # Extract transcript immediately before any logging
            t = (result.get("transcript") or "").strip()
            if t:
                transcripts.append(t)
            try:
                safe_t = t.encode("ascii", errors="backslashreplace").decode("ascii")
                print(f"[STT DEBUG] Chunk {idx+1}/{len(chunks)} transcript: '{safe_t}'")
            except Exception:
                pass
        except Exception as e:
            try:
                safe_err = str(e).encode("ascii", errors="backslashreplace").decode("ascii")
                print(f"[STT ERROR] Failed to transcribe chunk {idx+1}/{len(chunks)}: {safe_err}")
            except Exception:
                pass

    full_transcript = " ".join(transcripts).strip()
    try:
        safe_full = full_transcript.encode("ascii", errors="backslashreplace").decode("ascii")
        print(f"[STT DEBUG] Final unified transcript: '{safe_full}'")
    except Exception:
        pass
    return full_transcript
