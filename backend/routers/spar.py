"""
Spar session lifecycle routes:
  POST /spar/start          → create a session, get AI intro turn
  POST /spar/turn           → send audio, receive AI audio response
  POST /spar/end            → close session, trigger scribe
"""

import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from backend.services.gnani_stt import transcribe_audio
from backend.services.gnani_tts import synthesize_speech
from backend.services.socratic_engine import (
    SparSession,
    Stage,
    Turn,
    get_next_turn,
)
from backend.routers.topics import _TOPICS_PATH
from backend.services.socratic_engine import (
    SparSession, Stage, Turn, get_next_turn,
    init_session_cache, delete_session_cache,
)
import json

router = APIRouter(prefix="/spar", tags=["spar"])

# In-memory session store (replace with Redis for production)
_sessions: dict[str, SparSession] = {}


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class StartSparRequest(BaseModel):
    topic_id: str
    language: str = "en-IN"  # "en-IN" | "hi-IN"


class StartSparResponse(BaseModel):
    session_id: str
    intro_text: str  # The AI's opening trap (text)


class TurnTextResponse(BaseModel):
    session_id: str
    user_transcript: str
    ai_response: str
    stage: str
    is_complete: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_topic(topic_id: str) -> dict:
    with open(_TOPICS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for t in data:
        if t["id"] == topic_id:
            return t
    raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/start", response_model=StartSparResponse)
async def start_spar(req: StartSparRequest) -> StartSparResponse:
    """
    Initialize a new elenchus.ai sparring session.
    - Loads topic from topics.json
    - Creates a SparSession with cache-backed system prompt
    - Returns session_id + AI's opening intro text
    """
    topic = _load_topic(req.topic_id)
    session_id = str(uuid.uuid4())
    session = SparSession(
        topic_id=req.topic_id,
        topic_summary=topic["summary"],
        opening_trap=topic["opening_trap"],
        language=req.language,
        stage=Stage.INTRO,
    )
    # Initialize Gemini context cache for this session's static system prompt
    await init_session_cache(session)
    # Seed the opening AI turn (no user input at this point)
    intro_text = topic["opening_trap"]
    session.history.append(Turn(role="AI", text=intro_text))
    # Persist session
    _sessions[session_id] = session
    return StartSparResponse(session_id=session_id, intro_text=intro_text)


@router.post("/start/audio", response_class=Response)
async def start_spar_audio(
    topic_id: str,
    language: str = "en-IN",
) -> Response:
    """
    Voice-first variant of /spar/start.
    Returns the intro text synthesized as WAV audio.
    Session ID is passed back in the X-Session-Id response header.
    """
    topic = _load_topic(topic_id)
    session_id = str(uuid.uuid4())

    session = SparSession(
        topic_id=topic_id,
        topic_summary=topic["summary"],
        opening_trap=topic["opening_trap"],
        language=language,
        stage=Stage.INTRO,
    )

    # Initialize Gemini context cache
    await init_session_cache(session)


    intro_text = topic["opening_trap"]
    session.history.append(Turn(role="AI", text=intro_text))
    _sessions[session_id] = session

    # Syntheesize intro as audio
    audio_bytes = await synthesize_speech(intro_text, language=language)

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={"X-Session-Id": session_id, "X-Stage": session.stage.value},
    )


@router.post("/turn/text", response_model=TurnTextResponse)
async def spar_turn_text(session_id: str, user_text: str) -> TurnTextResponse:
    """
    Text-only turn (useful for testing the engine without audio).
    """
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    ai_response, is_complete = await get_next_turn(session, user_text)

    return TurnTextResponse(
        session_id=session_id,
        user_transcript=user_text,
        ai_response=ai_response,
        stage=session.stage.value,
        is_complete=is_complete,
    )


@router.post("/turn", response_class=Response)
async def spar_turn_audio(
    session_id: str,
    audio: UploadFile = File(...),
) -> Response:
    """
    Full voice turn:
      1. Receive audio file from browser
      2. Transcribe via Gnani Prisma STT
      3. Pass transcript to Socratic Engine
      4. Synthesize response via Gnani Timbre TTS
      5. Return WAV audio + metadata headers
    """
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Step 1: Transcribe
    audio_bytes = await audio.read()
    user_transcript = await transcribe_audio(audio_bytes, language=session.language)

    if not user_transcript:
        raise HTTPException(status_code=422, detail="Could not transcribe audio. Try again.")

    # Step 2: Socratic Engine
    ai_response, is_complete = await get_next_turn(session, user_transcript)

    # Step 3: Synthesize
    tts_audio = await synthesize_speech(ai_response, language=session.language)

    return Response(
        content=tts_audio,
        media_type="audio/wav",
        headers={
            "X-Session-Id": session_id,
            "X-User-Transcript": user_transcript,
            "X-Ai-Response": ai_response,
            "X-Stage": session.stage.value,
            "X-Is-Complete": str(is_complete).lower(),
        },
    )


@router.post("/end")
async def end_spar(session_id: str) -> dict:
    """
    Explicitly end a sparring session.
    - Deletes the Gemini context cache to avoid idle TTL billing
    - Removes the session from memory
    - Returns the full tagged conversation history for the Ambient Scribe
    """
    session = _sessions.pop(session_id, None)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Clean up the Gemini cache immediately
    await delete_session_cache(session)

    # Remove from in-memory store
    del _sessions[session_id]

    return {
        "session_id": session_id,
        "topic_id": session.topic_id,
        "language": session.language,
        "total_turns": session.turn_count,
        "final_stage": session.stage.value,
        # Tagged history ready for the Ambient Scribe
        "history": [
            {"role": turn.role, "text": turn.text}
            for turn in session.history
        ],
    }