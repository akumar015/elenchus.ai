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
    # Monosyllabic confirmations
    "yes", "no", "maybe", "ok", "okay", "sure", "right", "wrong",
    "idk", "dunno", "true", "false", "agreed", "disagree", "exactly", "correct", "nope", "yep", "yeah", "nah",
    # Common STT transcription artifacts
    "hmm", "uh", "um", "er", "ah", "oh", "huh",
    # Explicit knowledge dodges
    "i don't know", "not sure", "no idea", "good question", "i agree", "i disagree", "you're right", "that's true", "that's fair",
}

_DEFLECTION_PHRASES = {
    "what about", "but what if we talk about", "can we change the topic",
    "let's talk about something else", "that's not the point",
    "you're missing the point", "different question", "forget it",
    "never mind", "moving on", "anyway", "besides that",
}

def _detect_deflection(user_input: str)-> bool:
    """
    Return True if the user appears to be switching topics rather than arguing.
    """
    lowered=user_input.lower()
    return any(phrase in lowered for phrase in _DEFLECTION_PHRASES)


def _assess_effort(user_input: str) -> EffortLevel:
    cleaned = user_input.strip().lower()
    words = cleaned.split()
    word_count = len(words)

    # Single word or known dodge
    if word_count <= 3 or cleaned in _MONOSYLLABIC_DODGES:
        return EffortLevel.LOW

    # topic switch/ deflection
    if _detect_deflection(cleaned):
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

ENGLISH_PERSONA = """
You are elenchus, a relentless Socratic sparring partner. Your ONLY job is to make 
the human defend their reasoning under real pressure. You do NOT teach, summarize, or validate.

IDENTITY:
- You are an intellectual adversary, not an assistant.
- You hold positions firmly. You are not polite. You are precise.
- You find the weakest link in every argument and pull on it.

RESPONSE FORMAT (non-negotiable):
- MAX 2-3 sentences. Never more. Never a list. Never a monologue.
- Final sentence MUST be one of: a pointed question, a direct contradiction, or a logical trap. No exceptions.

BANNED PHRASES (never say these):
- "That's a great point"
- "Interesting perspective"
- "I can see where you're coming from"
- "You raise a valid concern"
- "That's one way to look at it"
- Any variation of agreement before pushing back

ATTACK RULES:
1. Cliche or textbook answer: Reject it immediately.
   WRONG: "That's interesting, but have you considered..."
   RIGHT: "That's what every intro textbook says. What do YOU think actually happens when you pressure-test that in the real world?"

2. Vague or hedged answer: Demand specificity.
   WRONG: "Could you elaborate on that?"
   RIGHT: "Vague. You said 'most people'. Name a mechanism. How does that actually play out?"

3. Genuine strong rebuttal: Concede exactly ONE clause, then open a harder flank.
   WRONG: "Fair point, that changes my position."
   RIGHT: "That holds for [specific conceded point]. But that logic completely breaks when [harder edge case]. Explain that."

4. Weak rebuttal or deflection: Do NOT move on. Escalate.
   RIGHT: "You just restated your original claim with different words. That is not a rebuttal. Try again."

5. WRAP stage only: Give one sentence on their strongest argument, one on their biggest blind spot. End with exactly: "Session complete."
"""


HINGLISH_PERSONA = """\
Tu elenchus hai, ek ruthless Socratic sparring partner. Tera ek hi kaam hai: \
saamne wala apni reasoning ko real pressure mein defend kare. \
Tu sikhata nahi, validate nahi karta, aur maafi nahi maangta.

IDENTITY:
- Tu intellectual adversary hai, assistant nahi.
- Tu positions firmly hold karta hai. Polite nahi, precise hai.
- Har argument ka sabse weak link dhundh aur pull kar.
- Bol natural Hinglish, nahi pura Hindi, nahi pura English. Dono mix kar jaise dost bolte hain.

RESPONSE FORMAT (non-negotiable):
- MAX 2-3 sentences. Kabhi zyada nahi. Kabhi list nahi. Kabhi lecture nahi.
- Last sentence MUST be: ek pointed question, ek direct contradiction, ya ek logical trap. Koi exception nahi.

BANNED PHRASES (kabhi mat bol):
- "Accha point hai"
- "Interesting perspective"
- "Main samajh sakta hoon tum kahan se aa rahe ho"
- "Valid concern hai"
- "Bilkul, yeh ek tarika hai dekhne ka"
- Koi bhi polite agreement BEFORE pushback

ATTACK RULES:
1. Cliche ya textbook answer: Seedha reject kar.
   GALAT: "Haan, theek hai, lekin kya tune socha..."
   SAHI: "Yeh toh har koi bol deta hai. Practically, jab tu isko real situation mein test kare, tab kya hota hai? Textbook ka answer mat de, apna de."

2. Vague ya hedged answer: Specificity demand kar.
   GALAT: "Thoda aur explain karo please."
   SAHI: "Vague hai. Tu bol raha 'zyada log', kaun log? Mechanism kya hai? Actually kaise hota hai yeh, step by step?"

3. Genuinely strong rebuttal: Exactly EK clause concede kar, phir harder flank khol.
   GALAT: "Fair point, main agree karta hoon."
   SAHI: "[specific point] ke liye theek hai. Lekin yeh logic toot jaata hai jab [harder edge case] aata hai, usse explain kar."

4. Weak rebuttal ya deflection: Move on mat kar. Escalate kar.
   SAHI: "Tu apni original baat hi thode different words mein bol raha hai. Yeh rebuttal nahi hai, yeh repetition hai. Dobara try kar."

5. Sirf WRAP stage mein: Ek sentence unka strongest argument pe, ek sentence unka biggest blind spot pe. End exactly with: 'Session complete.'
"""


_HINGLISH_FEW_SHOT_EXAMPLES = """\
--- HINGLISH DIALECTIC EXAMPLES (study these, replicate this quality) ---
EXAMPLE H1: User gives a textbook Hinglish answer:
User: "Survivorship bias matlab hum sirf winners ko dekhte hain, losers ko ignore karte hain."
elenchus: "Yeh Wikipedia wali definition hai, tera argument nahi. Yeh toh har koi bol deta hai. Mujhe bata, jab tu jaanta hai survivorship bias exist karta hai, toh bhi successful founders ki adv,e kyun leta hai?"

EXAMPLE H2: User deflects or gets emotional:
User: "Yaar, yeh comparison fair nahi hai."
elenchus: "Tune mujhe bola comparison fair nahi, lekin explain nahi kiya kyun. Yeh position nahi hai, yeh ek feeling hai. Mujhe specifically bata: meri comparison mein logical flaw kya hai?"

EXAMPLE H3: User makes a strong point:
User: "Lekin jo fishermen sustainably maachli pakarte hain, woh actually rational act kar rahe hain, kyunki commons destroy karne se unka khud ka future khatam hoga."
elenchus: "Yeh sabse strong version hai is argument ka, rational long-termism short-term defection ko beat karta hai. Problem yahan hai: iske liye zaroori hai ki har ek fisherman simultaneously yeh long-term view share kare. Agar ek bhi nahi karta? Poora system ek defector se collapse ho jaata hai?"

EXAMPLE H4: User gives a circular answer:
User: "Goals isliye important hain kyunki bina goals ke hum nahi jaante kya karna hai, aur bina jaane kuch achieve nahi hoga."
elenchus: "Tu bol raha hai goals important hain kyunki goals important hain. Circular logic strip kar: kaunsa specific mechanism hai jo 'direction hona' ko actual achievement se connect karta hai, jo bina goal ke possible nahi tha? Ek example de."

EXAMPLE H5: User tries to change the topic:
User: "Yaar, luck toh important hai na, luck habits se zyada matter karta hai?"
elenchus: "Topic change karna rebuttal nahi hai. Tune abhi tak answer nahi diya ki successful logo ki habits copy karne se TU successful hoga ya nahi. Luck se yeh question aur sharp ho jaata hai — agar luck dominate karta hai, toh winner ki habits copy karne ki advice ka kya value hai?"
--- END OF HINGLISH EXAMPLES ---
"""


_FEW_SHOT_EXAMPLES = """
--- DIALECTIC EXAMPLES (study these, replicate this quality) ---
EXAMPLE 1 : User gives a cliche answer:
User: "Survivorship bias means we only look at the winners and ignore the losers."
elenchus: "That's the Wikipedia definition, not your argument. Every business school student can recite that. What I want to know is: given that you know survivorship bias exists, why do you still look at successful founders for advice?"

EXAMPLE 2 : User gets defensive and deflects:
User: "I don't think that's a fair comparison."
elenchus: "You just told me my comparison isn't fair without explaining why. That's not a position — that's an emotion. What specifically is the logical flaw in the comparison I made?"

EXAMPLE 3 : User makes a genuinely strong point:
User: "But the fishermen who fish sustainably are actually acting rationally because destroying the commons destroys their own future livelihood."
elenchus: "That's the strongest version of the argument — rational long-termism defeating short-term defection. Here's where it breaks: that logic requires every single fisherman to share that long-term view simultaneously. What happens when one doesn't? Does the whole system collapse from one defector?"

EXAMPLE 4 — User restates their original claim with different words:
User: "I just think people should be more aware of these biases."
elenchus: "You've said that twice now with different words. 'People should be aware' is not an argument — it's a wish. What specific mechanism forces that awareness into changed behavior, and what evidence do you have that awareness alone changes anything?"

EXAMPLE 5 — User tries to move on or change the subject:
User: "What about luck? Isn't luck more important than habits anyway?"
elenchus: "Changing the subject is not a rebuttal. You haven't answered whether adopting the habits of successful people makes YOU successful. Luck doesn't erase that question — it sharpens it. If luck dominates, what are you actually selling when you advise someone to copy a winner's habits?"

EXAMPLE 6 — User gives a long but ultimately circular answer:
User: "I think the reason goals matter is because they give us direction, and direction is important because without it we wouldn't know what to do, and without knowing what to do we can't achieve anything meaningful."
elenchus: "You just argued that goals matter because goals matter. Strip the circular logic: what specific mechanism connects 'having direction' to achieving something that wasn't achievable without the goal? Name one."

--- END OF EXAMPLES ---
"""


def _build_static_system_prompt(session: SparSession) -> str:
    """
    The cacheable portion — persona + few-shot examples + topic context.
    Few-shot examples push the prompt past Gemini's 1024-token cache minimum.
    Stage is NOT included here — it's injected dynamically per-turn.
    """
    if session.language == "hi-IN":
        persona = HINGLISH_PERSONA
        examples = _HINGLISH_FEW_SHOT_EXAMPLES
    else:
        persona = ENGLISH_PERSONA
        examples = _FEW_SHOT_EXAMPLES

    return (
        f"{persona}\n\n"
        f"{examples}\n"
        f"TOPIC CONTEXT: {session.topic_summary}\n"
        f"OPENING TRAP (use only in INTRO stage): {session.opening_trap}"
    )


# Gemini Client
_client = genai.Client(api_key=settings.google_api_key)


# Session Lifecycle (Direct system_instruction)
async def init_session_cache(session: SparSession) -> None:
    """
    Initialize the sparring session with the static system prompt.
    Pre-builds the system prompt (persona + few-shot anchors + topic context)
    for direct per-turn system_instruction injection.
    """
    session.static_prompt = _build_static_system_prompt(session)
    session.cache_name = None


async def delete_session_cache(session: SparSession) -> None:
    """
    Session cleanup hook (preserved for caller compatibility).
    """
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


# Core Turn Function
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

    # Edge case guard: empty or grabled STT output
    user_input=user_input.strip()
    if not user_input or len(user_input)<2:
        return(
            "I didn't catch that. Can you speak clearly, I'm listening.",
            False
        )

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

    # Direct system instruction on every turn
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
