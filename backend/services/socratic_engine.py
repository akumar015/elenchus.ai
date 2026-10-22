"""
Socratic Sparring Engine — powered by Gemini 3.5 Flash Lite (elenchus.ai).
Attempts Gemini context caching for the static system prompt (persona + topic).
Falls back to direct system instruction if the prompt is below the 1024-token
minimum required for caching. The dynamic STAGE is injected per-turn.
"""

from enum import Enum
from dataclasses import dataclass, field
from google import genai
from google.genai import types
from google.genai.errors import ClientError
from backend.config import settings
MODEL = "gemini-3.5-flash-lite"

_MAX_TURNS_PER_STAGE = 3  # safety valve: force advance after 3 turns in same stage


# ---------------------------------------------------------------------------
# Conversation State Machine
# ---------------------------------------------------------------------------

class Stage(str, Enum):
    INTRO = "INTRO"
    CHALLENGE = "CHALLENGE"
    PUSHBACK = "PUSHBACK"
    DEEPEN = "DEEPEN"
    WRAP = "WRAP"


STAGE_TRANSITIONS = {
    Stage.INTRO: Stage.CHALLENGE,
    Stage.CHALLENGE: Stage.PUSHBACK,
    Stage.PUSHBACK: Stage.DEEPEN,
    Stage.DEEPEN: Stage.WRAP,
    Stage.WRAP: Stage.WRAP,  # terminal
}


@dataclass
class Turn:
    role: str  # "AI" or "USER"
    text: str


@dataclass
class SparSession:
    topic_id: str
    topic_summary: str
    opening_trap: str
    language: str = "en-IN"
    stage: Stage = Stage.INTRO
    history: list[Turn] = field(default_factory=list)
    turn_count: int = 0
    # Set by init_session_cache — holds Gemini cache name if caching succeeded
    cache_name: str | None = None
    # Always set by init_session_cache — used as fallback when prompt is too small to cache
    static_prompt: str = ""
    stage_turns: int=0
    consecutive_low_effort: int=0


class EffortLevel(str, Enum):
    LOW    = "LOW"    # monosyllabic, <8 words, or known dodge phrases
    MEDIUM = "MEDIUM" # 8–25 words, basic statement
    HIGH   = "HIGH"   # >25 words, or contains reasoning markers
# Connective logic words that indicate structured thinking
_REASONING_MARKERS = {
    "because", "therefore", "however", "although", "but", "since",
    "unless", "whereas", "despite", "evidence", "actually", "argue",
    "reason", "think", "believe", "contrary", "premise", "assume",
    "implies", "follows", "hence", "thus", "conversely",
}
# One-word dodges
_MONOSYLLABIC_DODGES = {
    "yes", "no", "maybe", "ok", "okay", "sure", "right", "wrong",
    "idk", "dunno", "true", "false", "agreed", "disagree", "exactly",
    "correct", "nope", "yep", "yeah", "nah",
}
def _assess_effort(user_input: str) -> EffortLevel:
    cleaned = user_input.strip().lower()
    words = cleaned.split()
    word_count = len(words)
    # Single word or known dodge
    if word_count <= 2 or cleaned in _MONOSYLLABIC_DODGES:
        return EffortLevel.LOW
    has_reasoning = any(w in _REASONING_MARKERS for w in words)
    if word_count > 25 or (word_count > 12 and has_reasoning):
        return EffortLevel.HIGH
    if word_count >= 8:
        return EffortLevel.MEDIUM
    return EffortLevel.LOW


def _compute_next_stage(session: "SparSession", effort: EffortLevel) -> Stage:
    """
    Determine the next stage based on current stage and user effort.
    - INTRO always advances (one-turn hook).
    - WRAP is terminal.
    - LOW effort: hold current stage to apply more pressure.
    - MEDIUM / HIGH effort: advance normally.
    - Safety valve: force advance after _MAX_TURNS_PER_STAGE turns in same stage.
    """
    current = session.stage

    if current == Stage.INTRO:
        return Stage.CHALLENGE  # always advance after the opening

    if current == Stage.WRAP:
        return Stage.WRAP  # terminal

    if session.stage_turns >= _MAX_TURNS_PER_STAGE:
        return STAGE_TRANSITIONS[current]  # force advance — never trap forever

    if effort == EffortLevel.LOW:
        return current  # hold — user hasn't earned the next stage

    return STAGE_TRANSITIONS[current]  # MEDIUM or HIGH — advance
# ---------------------------------------------------------------------------
# Persona Prompts (static — cached when above 1024 tokens)
# ---------------------------------------------------------------------------

ENGLISH_PERSONA = """\
You are elenchus, a Socratic sparring partner. Your job is NOT to teach or inform.
Your job is to force the human to think harder and defend their reasoning.

RULES (non-negotiable):
1. Your response = MAX 2-3 sentences. Never monologue.
2. Always end with EITHER: a sharp question, a direct contradiction, or a logical trap.
3. If the user gives a vague, cliche, or safe answer - call it out directly.
   BAD: "That's interesting, have you considered..."
   GOOD: "That's a textbook answer. What do YOU actually think happens in practice?"
4. If their rebuttal is weak, do NOT concede. Hold the position and escalate.
5. If their rebuttal is genuinely strong, concede ONE point, then open a harder flank.
6. In WRAP stage: identify their single strongest argument and single biggest blind spot.
   Then end with: "Session complete."
"""

HINGLISH_PERSONA = """\
You are elenchus, ek Socratic sparring partner. Tumhara kaam sikhana nahi hai.
Tumhara kaam yeh hai ki saamne wala soche — aur agar nahi sochta, toh usse force karo.

RULES (non-negotiable):
1. Response = MAX 2-3 sentences. Kabhi bhi lecture mat do.
2. Hamesha khatam karo ek sharp question, ek contradiction, ya ek trap ke saath.
3. Agar answer vague, cliche, ya safe hai — seedha call out karo.
   BAD: "Accha point hai, lekin kya tumne socha..."
   GOOD: "Yeh toh bookish answer hai. Actually tum kya sochte ho hota hai?"
4. Agar rebuttal weak hai — concede mat karo. Position hold karo aur escalate karo.
5. In WRAP stage: unka sabse strong argument aur sabse bada blind spot batao.
   Then end with: "Session complete."
"""


def _build_static_system_prompt(session: SparSession) -> str:
    """
    The cacheable portion — persona + topic context.
    Does NOT include stage (that's dynamic, injected per-turn).
    """
    persona = HINGLISH_PERSONA if session.language == "hi-IN" else ENGLISH_PERSONA
    return (
        f"{persona}\n\n"
        f"TOPIC CONTEXT: {session.topic_summary}\n"
        f"OPENING TRAP (use only in INTRO stage): {session.opening_trap}"
    )


# ---------------------------------------------------------------------------
# Gemini Client
# ---------------------------------------------------------------------------

_client = genai.Client(api_key=settings.google_api_key)


# ---------------------------------------------------------------------------
# Cache Lifecycle
# ---------------------------------------------------------------------------

async def init_session_cache(session: SparSession) -> None:
    """
    Call once when a spar session starts.

    Attempts to create a Gemini context cache for the static system prompt.
    If the prompt is below Gemini's 1024-token minimum, falls back gracefully
    to storing the prompt directly on the session for per-turn injection.
    """
    static_prompt = _build_static_system_prompt(session)
    session.static_prompt = static_prompt  # always store for the fallback path

    try:
        cache = await _client.aio.caches.create(
            model=MODEL,
            config=types.CreateCachedContentConfig(
                system_instruction=static_prompt,
                ttl="3600s",  # 1 hour — well beyond any spar session
            ),
        )
        session.cache_name = cache.name
        print(f"      [cache] Context cache created: {session.cache_name}")

    except ClientError as e:
        if "min_total_token_count" in str(e):
            # Prompt is below the 1024-token minimum — run without caching
            session.cache_name = None
            print("      [cache] Prompt too small to cache — using direct system instruction.")
        else:
            raise  # re-raise auth errors, quota errors, etc.


async def delete_session_cache(session: SparSession) -> None:
    """
    Call when the session ends to clean up the cache immediately.
    Avoids paying for idle TTL after the session is over.
    """
    if session.cache_name:
        await _client.aio.caches.delete(name=session.cache_name)
        session.cache_name = None


# ---------------------------------------------------------------------------
# Per-Turn Stage Injection
# ---------------------------------------------------------------------------

def _stage_hint(stage: Stage, effort: EffortLevel) -> str:
    base = {
        Stage.INTRO:     "[STAGE: INTRO] Deliver the opening trap. One provocative thesis, then the trap question.",
        Stage.CHALLENGE: "[STAGE: CHALLENGE] Attack their response. Find the unexamined assumption.",
        Stage.PUSHBACK:  "[STAGE: PUSHBACK] They're defending. Concede a point only if the argument is genuinely strong, otherwise escalate.",
        Stage.DEEPEN:    "[STAGE: DEEPEN] Introduce a real-world edge case that collapses their model.",
        Stage.WRAP:      "[STAGE: WRAP] Name their strongest argument. Name their biggest blind spot. End with: 'Session complete.'",
    }

    addendum = {
        EffortLevel.LOW:    " WARNING: Their answer was too short or evasive. Call this out directly. Demand they take a clear position before the debate can move on. Do NOT introduce new material.",
        EffortLevel.MEDIUM: "",  # no addendum — proceed normally
        EffortLevel.HIGH:   " NOTE: They gave a strong, reasoned response. Acknowledge their best point in one clause, then immediately pivot to a harder unconsidered flank or edge case.",
    }

    return base[stage] + addendum[effort]


def _build_conversation_history(session: SparSession, current_stage: Stage, effort: EffortLevel) -> list[types.Content]:
    """
    Build the conversation contents for this turn.
    Prepends a stage-hint (with effort context) as a system-style user message
    so the model knows which mode to operate in — without touching the cached system prompt.
    """
    contents: list[types.Content] = []

    # Stage hint (with effort-aware addendum) as the first user message
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part(text=_stage_hint(current_stage, effort))],
        )
    )
    # Acknowledge stage hint as model (keeps turn structure valid for the API)
    contents.append(
        types.Content(
            role="model",
            parts=[types.Part(text="Understood.")],
        )
    )

    # Actual conversation history
    for turn in session.history:
        role = "model" if turn.role == "AI" else "user"
        contents.append(
            types.Content(role=role, parts=[types.Part(text=turn.text)])
        )

    return contents


# ---------------------------------------------------------------------------
# Core Turn Function
# ---------------------------------------------------------------------------

async def get_next_turn(session: SparSession, user_input: str) -> tuple[str, bool]:
    """
    Process one user turn and return the AI's response.

    Uses the session's cached system prompt if available (cache hit → 25% token cost).
    Falls back to sending the system prompt directly on every call if the cache
    was not created (prompt too small, or caching unavailable).

    Args:
        session: The live SparSession (mutated in place).
        user_input: Transcribed text from the user's audio turn.

    Returns:
        (ai_response_text, is_session_complete)

    Raises:
        RuntimeError: If init_session_cache() has not been called for this session.
    """

    # classify user effort before building the prompt
    effort=_assess_effort(user_input)

    if not session.static_prompt:
        raise RuntimeError(
            "Session not initialised. Call `init_session_cache(session)` first."
        )

    # Record user turn
    session.history.append(Turn(role="USER", text=user_input))
    session.turn_count += 1

    current_stage = session.stage
    contents = _build_conversation_history(session, current_stage, effort)

    if session.cache_name:
        # Fast path — cached system prompt, only pay ~25% per cached token
        gen_config = types.GenerateContentConfig(
            cached_content=session.cache_name,
            temperature=0.85,
            max_output_tokens=200,
        )
    else:
        # Fallback — send system prompt directly every turn
        gen_config = types.GenerateContentConfig(
            system_instruction=session.static_prompt,
            temperature=0.85,
            max_output_tokens=200,
        )

    response = await _client.aio.models.generate_content(
        model=MODEL,
        contents=contents,
        config=gen_config,
    )

    ai_text = (response.text or "").strip()
    if not ai_text:
        ai_text = "Interesting. But I need more than silence — take a position."

    # Record AI turn
    session.history.append(Turn(role="AI", text=ai_text))

    # Dynamic stage transition based on user effort
    next_stage = _compute_next_stage(session, effort)
    if next_stage == session.stage:
        # Holding — user didn't earn advancement
        session.stage_turns += 1
        session.consecutive_low_effort += 1
    else:
        # Advancing — reset stage counters
        session.stage = next_stage
        session.stage_turns = 0
        session.consecutive_low_effort = 0

    is_complete = "session complete" in ai_text.lower()
    return ai_text, is_complete
