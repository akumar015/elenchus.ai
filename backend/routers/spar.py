"""
Spar session lifecycle routes:
  POST /spar/start          → create a session, get AI intro turn
  POST /spar/start/audio    → voice-first session init
  POST /spar/turn           → send audio, receive AI audio response
  POST /spar/turn/text      → send text turn, receive AI text response
  POST /spar/session/{id}/language → dynamically switch dialectic language
  POST /spar/end            → close session, trigger scribe
"""

import uuid
import json
import urllib.parse
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
    init_session_cache,
    delete_session_cache,
    _build_static_system_prompt,
)
from backend.services.scribe import generate_thought_card, ThoughtCard
from backend.routers.topics import _TOPICS_PATH

router = APIRouter(prefix="/spar", tags=["spar"])

# In-memory session store
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


class TurnTextRequest(BaseModel):
    session_id: str
    user_text: str
    language: str | None = None


class TurnTextResponse(BaseModel):
    session_id: str
    user_transcript: str
    ai_response: str
    stage: str
    is_complete: bool


class LanguageUpdateRequest(BaseModel):
    language: str  # "en-IN" | "hi-IN"


# ---------------------------------------------------------------------------
# Helpers & Custom Topic Registry (Phase 5.5)
# ---------------------------------------------------------------------------

_custom_topics: dict[str, dict] = {}


def register_custom_topic(topic_data: dict) -> None:
    """Store dynamically synthesized topics in memory for the server lifetime."""
    _custom_topics[topic_data["id"]] = topic_data


def _load_topic(topic_id: str) -> dict:
    # 1. Check dynamically synthesized custom spark topics
    if topic_id in _custom_topics:
        return _custom_topics[topic_id]

    # 2. Check static daily drops in topics.json
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
    Initialize a new elenchus.ai sparring session (text response).
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
    # Initialize Gemini context cache / prompt
    await init_session_cache(session)
    intro_text = topic["opening_trap"]
    session.history.append(Turn(role="AI", text=intro_text))
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

    # Initialize Gemini context cache / prompt
    await init_session_cache(session)

    intro_text = topic["opening_trap"]
    session.history.append(Turn(role="AI", text=intro_text))
    _sessions[session_id] = session

    # Synthesize intro as audio (auto-routes to Poorvi if hi-IN, Kaveri if en-IN)
    audio_bytes = await synthesize_speech(intro_text, language=language)

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={
            "X-Session-Id": session_id,
            "X-Stage": session.stage.value,
            "X-Ai-Response": urllib.parse.quote(intro_text),
        },
    )


@router.post("/session/{session_id}/language")
async def update_session_language(
    session_id: str,
    req: LanguageUpdateRequest,
) -> dict:
    """
    Dynamically update the active dialectic language for a sparring session.
    Switches between 'en-IN' (Indian English · Kaveri) and 'hi-IN' (Hinglish · Poorvi).
    """
    if req.language not in {"en-IN", "hi-IN"}:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported language code '{req.language}'. Must be 'en-IN' or 'hi-IN'.",
        )
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.language = req.language
    session.static_prompt = _build_static_system_prompt(session)

    return {
        "status": "ok",
        "session_id": session_id,
        "language": req.language,
        "voice": "Poorvi" if req.language == "hi-IN" else "Kaveri",
    }


@router.post("/turn/text", response_model=TurnTextResponse)
async def spar_turn_text(
    body: TurnTextRequest | None = None,
    session_id: str | None = None,
    user_text: str | None = None,
) -> TurnTextResponse:
    """
    Text turn handling both JSON body and query parameters.
    """
    sid = body.session_id if body else session_id
    text = body.user_text if body else user_text
    lang = body.language if body else None

    if not sid or not text:
        raise HTTPException(status_code=422, detail="session_id and user_text are required")

    session = _sessions.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Sync language if requested
    if lang and lang in {"en-IN", "hi-IN"} and session.language != lang:
        session.language = lang
        session.static_prompt = _build_static_system_prompt(session)

    ai_response, is_complete = await get_next_turn(session, text)

    return TurnTextResponse(
        session_id=sid,
        user_transcript=text,
        ai_response=ai_response,
        stage=session.stage.value,
        is_complete=is_complete,
    )


@router.post("/turn", response_class=Response)
async def spar_turn_audio(
    session_id: str,
    language: str | None = None,
    audio: UploadFile = File(...),
) -> Response:
    """
    Full voice turn:
      1. Receive audio file from browser
      2. Transcribe via Gnani Prisma STT (with session language code)
      3. Pass transcript to Socratic Engine
      4. Synthesize response via Gnani Timbre TTS (Kaveri or Poorvi)
      5. Return WAV audio + metadata headers
    """
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Sync language if requested
    if language and language in {"en-IN", "hi-IN"} and session.language != language:
        session.language = language
        session.static_prompt = _build_static_system_prompt(session)

    # Step 1: Transcribe with current session language
    audio_bytes = await audio.read()
    user_transcript = await transcribe_audio(audio_bytes, language=session.language)

    # In-character recovery for empty/unintelligible audio (Phase 6.2)
    if not user_transcript:
        if session.language == "hi-IN":
            fallback_msg = "Mujhe sunai nahi diya. Clear bolo aur apna point defend karo."
        else:
            fallback_msg = "I couldn't hear that premise. Speak clearly and defend your point."

        tts_audio = await synthesize_speech(fallback_msg, language=session.language)
        return Response(
            content=tts_audio,
            media_type="audio/wav",
            headers={
                "X-Session-Id": session_id,
                "X-User-Transcript": urllib.parse.quote("..."),
                "X-Ai-Response": urllib.parse.quote(fallback_msg),
                "X-Stage": session.stage.value,
                "X-Is-Complete": "false",
                "X-Language": session.language,
            },
        )

    # Step 2: Socratic Engine
    ai_response, is_complete = await get_next_turn(session, user_transcript)

    # Step 3: Synthesize (auto-routes to Poorvi for hi-IN, Kaveri for en-IN)
    tts_audio = await synthesize_speech(ai_response, language=session.language)

    return Response(
        content=tts_audio,
        media_type="audio/wav",
        headers={
            "X-Session-Id": session_id,
            "X-User-Transcript": urllib.parse.quote(user_transcript),
            "X-Ai-Response": urllib.parse.quote(ai_response),
            "X-Stage": session.stage.value,
            "X-Is-Complete": str(is_complete).lower(),
            "X-Language": session.language,
        },
    )


@router.post("/end")
async def end_spar(session_id: str) -> dict:
    """
    Explicitly end a sparring session.
    - Deletes the Gemini context cache
    - Removes session from memory
    - Returns full tagged history + Atomic Thought Card
    """
    session = _sessions.pop(session_id, None)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await delete_session_cache(session)

    history = [{"role": turn.role, "text": turn.text} for turn in session.history]

    # Run scribe — always returns a card, never throws
    thought_card: ThoughtCard = await generate_thought_card(
        topic_id=session.topic_id,
        topic_summary=session.topic_summary,
        history=history,
        language=session.language,
    )

    return {
        "session_id": session_id,
        "topic_id": session.topic_id,
        "language": session.language,
        "total_turns": session.turn_count,
        "final_stage": session.stage.value,
        "history": history,
        "thought_card": thought_card.model_dump(),
    }
