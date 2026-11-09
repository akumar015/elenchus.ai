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
import asyncio
import base64
import urllib.parse
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Literal
from fastapi.responses import Response, JSONResponse

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
from backend.services.podcast_engine import(
    PodcastSession,
    PodcastTurn,
    DialogueSegment,
    get_next_podcast_turn
)
from backend.services.dossier_loader import load_topic_dossier
from backend.services.scribe import generate_thought_card, ThoughtCard
from backend.routers.topics import _TOPICS_PATH
from backend.services.dossier_loader import load_topic_dossier

router = APIRouter(prefix="/spar", tags=["spar"])

# In-memory session store
_sessions: dict[str, SparSession | PodcastSession] = {}


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class StartSparRequest(BaseModel):
    topic_id: str
    language: str = "en-IN"  # "en-IN" | "hi-IN"
    mode: Literal["spar", "podcast"] = "podcast"
    user_name: str = "Guest"


class DialogueSegmentPayload(BaseModel):
    speaker: str    # "Host1", "Host2", or "AI"
    voice: str      # "Kalpana", "Shivani", or "Avinash"
    text: str
    audio_base64: str | None= None


class StartSparResponse(BaseModel):
    session_id: str
    intro_text: str  # The AI's opening trap (text)
    mode: str= "spar"
    dialogue: list[DialogueSegmentPayload] | None= None


class TurnTextRequest(BaseModel):
    session_id: str
    user_text: str
    language: str | None = None


class TurnTextResponse(BaseModel):
    session_id: str
    mode: str= "spar"
    user_transcript: str
    ai_response: str
    stage: str
    is_complete: bool
    dialogue: list[DialogueSegmentPayload] | None= None
    directed_at_guest: bool= True
    topic_insight: str | None= None


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
        t = dict(_custom_topics[topic_id])
        if "dossier" not in t or not t["dossier"]:
            t["dossier"] = load_topic_dossier(topic_id, t.get("summary", ""))
        return t

    # 2. Check static daily drops in topics.json
    with open(_TOPICS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for t in data:
        if t["id"] == topic_id:
            topic_dict = dict(t)
            topic_dict["dossier"] = load_topic_dossier(t["id"], t.get("summary", ""))
            return topic_dict

    # 3. Dynamic fallback for freeform premises / unknown slugs
    clean_title = topic_id.replace("custom-", "").replace("-", " ").title()
    fallback_topic = {
        "id": topic_id,
        "title": clean_title,
        "category": "User Inscribed Premise",
        "summary": clean_title,
        "opening_trap": f"State your conviction clearly so the hosts can test where {clean_title} fractures.",
        "dossier": load_topic_dossier(topic_id, clean_title),
    }
    _custom_topics[topic_id] = fallback_topic
    return fallback_topic


async def _synthesize_podcast_dialogue(
    dialogue: list[DialogueSegment],
    language: str,
) -> list[DialogueSegmentPayload]:
    """
    Synthesize all dialogue segments sequentially to respect Gnani's concurrency rate limit.
    Logs any synthesis errors explicitly so issues are immediately visible.
    """
    payloads: list[DialogueSegmentPayload] = []
    for seg in dialogue:
        b64: str | None = None
        try:
            audio_bytes = await synthesize_speech(
                seg.text,
                voice=seg.voice,
                language=language,
            )
            if isinstance(audio_bytes, bytes) and len(audio_bytes) > 0:
                b64 = base64.b64encode(audio_bytes).decode("utf-8")
        except Exception as e:
            try:
                safe_err = str(e).encode("ascii", errors="backslashreplace").decode("ascii")
                print(f"[TTS ERROR] Failed to synthesize segment for {seg.speaker} ({seg.voice}): {safe_err}")
            except Exception:
                pass
        payloads.append(
            DialogueSegmentPayload(
                speaker=seg.speaker,
                voice=seg.voice,
                text=seg.text,
                audio_base64=b64,
            )
        )
    return payloads

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/start", response_model=StartSparResponse)
async def start_spar(req: StartSparRequest) -> StartSparResponse:
    """
    Initialize a new elenchus.ai sparring session (text response).
    Routes to podcast studio (default) or socratic sparring arena
    """
    topic = _load_topic(req.topic_id)
    session_id = str(uuid.uuid4())

    if req.mode== "podcast":
        session= PodcastSession(
            topic_id=req.topic_id,
            topic_title=topic.get("title", req.topic_id),
            topic_summary=topic.get("summary", ""),
            topic_dossier=topic.get("dossier", ""),
            language= req.language,
            user_name=req.user_name,
        )

        # Kickoff initial podcst Dialogue
        turn = await get_next_podcast_turn(session, "Let's start the show.")
        payload_dialogue= await _synthesize_podcast_dialogue(turn.dialogue, req.language)
        _sessions[session_id]= session

        intro_text= " ".join(seg.text for seg in turn.dialogue)

        return StartSparResponse(
            session_id=session_id,
            mode="podcast",
            intro_text=intro_text,
            dialogue=payload_dialogue
        )

    # Sparring Arena mode (1 on 1)
    session = SparSession(
        topic_id=req.topic_id,
        topic_summary=topic["summary"],
        opening_trap=topic["opening_trap"],
        language=req.language,
        stage=Stage.INTRO,
        topic_dossier=topic.get("dossier","")
    )
    # Initialize Gemini context cache / prompt
    await init_session_cache(session)
    intro_text, _ = await get_next_turn(session, "Let's start.")
    _sessions[session_id]= session

    return StartSparResponse(
        session_id=session_id, 
        mode="spar", 
        intro_text=intro_text
        )


@router.post("/turn/text", response_model=TurnTextResponse)
async def spar_turn_text(
    body: TurnTextRequest | None= None,
    session_id: str | None= None,
    user_text: str | None= None,
)-> TurnTextResponse:
    sid= body.session_id if body else session_id
    text= body.user_text if body else user_text
    lang= body.language if body else None

    if not sid or not text:
        raise HTTPException(status_code=422, detail="sesssion_id and user_text are required")

    session= _sessions.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Session Not Found")

    #sync language if requested
    if lang and lang in {"en-IN", "hi-IN", "pa-IN", "te-IN"} and session.language != lang:
        session.language= lang
        if isinstance(session, SparSession):
            session.static_prompt= _build_static_system_prompt(session)

    #1. Podcast studio turn
    if isinstance(session, PodcastSession):
        turn: PodcastTurn= await get_next_podcast_turn(session, text)
        dialogue_payload= await _synthesize_podcast_dialogue(turn.dialogue, session.language)
        ai_response_text= " ".join(seg.text for seg in turn.dialogue)

        return TurnTextResponse(
            session_id=sid,
            mode="podcast",
            user_transcript=text,
            ai_response=ai_response_text,
            stage= "STUDIO",
            is_complete=turn.is_complete,
            dialogue=dialogue_payload,
            directed_at_guest=turn.directed_at_guest,
            topic_insight=turn.topic_insight
        )

    #2. Socratic sparring turn
    ai_response, is_complete= await get_next_turn(session, text)
    return TurnTextResponse(
        session_id=sid,
        mode="spar",
        user_transcript=text,
        ai_response=ai_response,
        stage=session.stage.value,
        is_complete=is_complete,
        dialogue=None
    )

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

    intro_text, _ = await get_next_turn(session, "Let's start.")
    _sessions[session_id] = session

    # Synthesize intro as audio (auto-routes to Shivani if hi-IN, Kalpana if en-IN)
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
    Switches between 'en-IN' (Indian English · Kalpana) and 'hi-IN' (Hinglish · Shivani).
    """
    if req.language not in {"en-IN", "hi-IN", "pa-IN", "te-IN"}:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported language code '{req.language}'. Must be 'en-IN', 'hi-IN', 'pa-IN', or 'te-IN'.",
        )
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.language = req.language
    if isinstance(session, SparSession):
        session.static_prompt = _build_static_system_prompt(session)

    voice_name = "Kalpana"
    if req.language == "hi-IN":
        voice_name = "Shivani"
    elif req.language == "pa-IN":
        voice_name = "Tarika"
    elif req.language == "te-IN":
        voice_name = "Lakshmi"

    return {
        "status": "ok",
        "session_id": session_id,
        "language": req.language,
        "voice": voice_name,
    }


@router.post("/turn", response_class=Response)
async def spar_turn_audio(
    session_id: str,
    language: str | None = None,
    audio: UploadFile = File(...),
) -> Response:
    """
    Voice turn:
      1. Transcribe audio via Gnani Prisma STT
      2. If Podcast Session: Generate multi-speaker dialogue + parallel TTS + return JSON payload
      3. If Spar Session: Generate 1-on-1 turn + return WAV response with telemetry headers
    """
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Sync language if requested
    if language and language in {"en-IN", "hi-IN", "pa-IN", "te-IN"} and session.language != language:
        session.language = language
        if isinstance(session, SparSession):
            session.static_prompt = _build_static_system_prompt(session)

    # Step 1: Transcribe with current session language
    audio_bytes = await audio.read()
    user_transcript = await transcribe_audio(audio_bytes, language=session.language)

    # In-character recovery for empty/unintelligible audio (Phase 6.2)
    if not user_transcript:
        if session.language == "hi-IN":
            fallback_msg = "मुझे ठीक से सुनाई नहीं दिया। क्या आप अपनी बात दोबारा दोहरा सकते हैं?"
        elif session.language == "pa-IN":
            fallback_msg = "ਮੈਨੂੰ ਠੀਕ ਤਰ੍ਹਾਂ ਸੁਣਾਈ ਨਹੀਂ ਦਿੱਤਾ। ਕੀ ਤੁਸੀਂ ਆਪਣੀ ਗੱਲ ਦੁਬਾਰਾ ਦੁਹਰਾ ਸਕਦੇ ਹੋ?"
        elif session.language == "te-IN":
            fallback_msg = "నాకు సరిగ్గా వినబడలేదు. దయచేసి మళ్లీ చెప్పగలరా?"
        else:
            fallback_msg = "I couldn't hear that premise. Can you repeat again."

        host1_voice = "Kalpana"
        if session.language == "hi-IN":
            host1_voice = "Shivani"
        elif session.language == "pa-IN":
            host1_voice = "Tarika"
        elif session.language == "te-IN":
            host1_voice = "Lakshmi"

        if isinstance(session, PodcastSession):
            fallback_audio= await synthesize_speech(fallback_msg, voice=host1_voice, language=session.language)
            b64= base64.b64encode(fallback_audio).decode("utf-8")
            return JSONResponse(
                content={
                    "session_id": session_id,
                    "mode": "podcast",
                    "user_transcript": "...",
                    "ai_response": fallback_msg,
                    "stage": "STUDIO",
                    "is_complete": False,
                    "dialogue": [
                        {
                            "speaker": "Host1",
                            "voice": host1_voice,
                            "text": fallback_msg,
                            "audio_base64": b64
                        }
                    ],
                    "directed_at_guest": True,
                    "topic_insight": None,
                }
            )

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

    # 1. Podcast Studio Engine Turn
    if isinstance(session, PodcastSession):
        turn: PodcastTurn = await get_next_podcast_turn(session, user_transcript)
        dialogue_payload = await _synthesize_podcast_dialogue(turn.dialogue, session.language)
        ai_response_text = " ".join(seg.text for seg in turn.dialogue)
        return JSONResponse(
            content={
                "session_id": session_id,
                "mode": "podcast",
                "user_transcript": user_transcript,
                "ai_response": ai_response_text,
                "stage": "STUDIO",
                "is_complete": turn.is_complete,
                "dialogue": [seg.model_dump() for seg in dialogue_payload],
                "directed_at_guest": turn.directed_at_guest,
                "topic_insight": turn.topic_insight,
            }
        )

    # Step 2: Socratic Engine
    ai_response, is_complete = await get_next_turn(session, user_transcript)

    # Step 3: Synthesize (auto-routes to Shivani for hi-IN, Kalpana for en-IN)
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

    if isinstance(session, SparSession):
        await delete_session_cache(session)

        history = [{"role": turn.role, "text": turn.text} for turn in session.history]
        topic_summary= session.topic_summary
        final_stage= session.stage.value

    else:
        #PodcastSession
        history= session.history
        topic_summary= session.topic_summary
        final_stage= "STUDIO"


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
        "final_stage": final_stage,
        "history": history,
        "thought_card": thought_card.model_dump(),
    }
