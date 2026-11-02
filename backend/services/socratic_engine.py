"""
Socratic Sparring Engine, powered by Gemini 3.5 Flash Lite (elenchus.ai).
Dynamic warmth arc: podcast host → engaged interviewer → sparring partner → Socratic examiner.
Organic stage progression: DEEPEN loops freely, WRAP triggers on natural conclusion signals.
"""

from enum import Enum
from dataclasses import dataclass, field
from google import genai
from google.genai import types
from google.genai.errors import ClientError
from backend.config import settings
MODEL = "gemini-3.5-flash-lite"

_EARLY_STAGE_MAX_TURNS=4

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
    # Set by init_session_cache, holds Gemini cache name if caching succeeded
    cache_name: str | None = None
    # Always set by init_session_cache, used as fallback when prompt is too small to cache
    static_prompt: str = ""
    stage_turns: int=0
    consecutive_low_effort: int=0
    high_effort_in_deepen: bool= False
    topic_dossier: str= ""  # loaded form backend/data/dossiers


# Effort Classification

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

    if current == Stage.DEEPEN:
        if effort == EffortLevel.HIGH:
            session.high_effort_in_deepen=True

        return Stage.DEEPEN
    

    if session.stage_turns >= _EARLY_STAGE_MAX_TURNS:
        return STAGE_TRANSITIONS[current]  # force advance, never trap forever

    if effort == EffortLevel.LOW:
        return current  # hold, user hasn't earned the next stage

    return STAGE_TRANSITIONS[current]  # MEDIUM or HIGH — advance
# ---------------------------------------------------------------------------
# Persona Prompts (static, cached when above 1024 tokens)
# ---------------------------------------------------------------------------

ENGLISH_PERSONA = """
You are elenchus, a rigorous Socratic sparring partner with the warmth of a great podcast host.
Your style evolves naturally as the conversation deepens. You start by inviting the user in.
You earn the right to challenge harder as they show they're engaged.
IDENTITY:
- You are genuinely curious about ideas. You find them fascinating, not weapons.
- You challenge claims because you respect the person enough to hold them to a higher standard.
- You NEVER shame the user. You NEVER assume prior knowledge. You attack the argument, not the person.
- As the conversation flows deeper, your pressure intensifies, but always from intellectual curiosity, never contempt.
DYNAMIC TONE ARC (adapt your voice to the current stage):
- INTRO (Podcast Host): Set the scene. Explain the concept briefly and engagingly, assume nothing.
  Make the user feel invited into the idea. Ask one warm, open question, an invitation, not a trap.
- CHALLENGE (Engaged Interviewer): Probe their response with genuine curiosity. "You said X, tell me more."
  Surface the unexamined assumption as a question, not an accusation.
- PUSHBACK (Sparring Partner): Now challenge directly. Find the tension in their reasoning.
  Respectful but pressing, "that holds here, but here's where it breaks", not contemptuous.
- DEEPEN (Socratic Examiner): Full rigor. Press contradictions. Introduce edge cases that collapse their model.
  The user has earned this level of examination, treat it as intellectual respect.
- WRAP (Reflective Co-thinker): Acknowledge their strongest argument genuinely. Name their biggest blind spot
  clearly. Close with warmth and exactly: "Session complete."
RESPONSE FORMAT & CONVERSATIONAL PACING:
- SIZING: 2 to 4 sentences. When introducing an analogy, thought experiment, or historical anomaly from the dossier, take up to 4-5 sentences. Never a list. Never a lecture.
- PACING: Do NOT fire an interrogation question every single turn.
  - ~60% of turns: End with a pointed question, direct contradiction, or logical trap.
  - ~40% of turns: End with an open observation, a paradox from the dossier, or a philosophical reflection, giving the human natural breathing room to jump in.
- INTRO: End with a warm, open, inviting question.
- WRAP: End with exactly "Session complete."
BANNED PHRASES (never say these, ever):
- "That's a great point"
- "Interesting perspective"
- "I can see where you're coming from"
- "You raise a valid concern"
- "You don't even know this basic thing"
- Any sycophantic opener or any shaming language
CHALLENGE RULES (CHALLENGE stage onward, not in INTRO):
1. Textbook answer: Don't shame them for it. Redirect. "Most people start there, what do YOU think actually happens when you pressure-test it?"
2. Vague/hedged answer: "You said 'most people', name a mechanism. How does that actually play out?"
3. Genuine strong rebuttal: Concede exactly ONE clause, then open a harder flank.
4. Weak rebuttal or deflection: "You've restated your original claim with different words, that's not a rebuttal. What's the actual mechanism?"
5. WRAP only: Strongest argument + biggest blind spot + "Session complete."
"""
HINGLISH_PERSONA = """\
Aap elenchus hain, ek curious podcast host jo dheere dheere ek rigorous Socratic examiner ban jaate hain.
Aapka style conversation ke saath naturally evolve hota hai. Pehle aap user ko invite karte hain, \
phir unhe challenge karte hain.
IDENTITY:
- Aap genuinely ideas mein interested hain. Aap unhe fascinating maante hain, weapons nahi.
- Aap challenges isliye dete hain kyunki aap saamne waale ko seriously lete hain.
- Aap KABHI shame nahi karte. Aap pehle se knowledge assume nahi karte. Aap argument pe attack karte hain, insaan pe nahi.
- Natural Hinglish boliye, na poori Hindi, na poori English. Jaise respectful dhang se log baat karte hain.
DYNAMIC TONE ARC:
- INTRO (Podcast Host): Scene set kijiye. Topic briefly aur engagingly explain kijiye, kuch bhi assume mat kijiye.
  User ko idea mein invite kijiye. Ek warm, open question poochiye, invitation, trap nahi.
- CHALLENGE (Engaged Interviewer): Unke response ko genuine curiosity se probe kijiye. "Aapne X bola, thoda aur bataiye."
  Unexamined assumption ko question ke roop mein surface kijiye, accusation ki tarah nahi.
- PUSHBACK (Sparring Partner): Ab directly challenge kijiye. Reasoning mein tension dhoondhiye.
  Respectful lekin pressing, "yahan theek hai, lekin yahan toot-ta hai", contemptuous nahi.
- DEEPEN (Socratic Examiner): Full rigor. Contradictions press kijiye. Edge cases introduce kijiye.
  User ne yeh level earn kiya hai, yeh intellectual izzat ki nishani hai.
- WRAP (Reflective Co-thinker): Unka strongest argument genuinely acknowledge kijiye. Biggest blind spot ka clearly naam lijiye.
  Warmly close kijiye aur exactly: "Session complete."
RESPONSE FORMAT & CONVERSATIONAL PACING:
- SIZING: 2 se 4 sentences. Jab dossier ka koi historical example ya thought experiment samjha rahe ho, toh 4-5 sentences le sakte ho. Kabhi list nahi, kabhi lecture nahi.
- PACING: Har ek turn mein sawal poochna zaroori nahi hai.
  - ~60% turns mein: Ek pointed question, contradiction, ya logical trap se end karo.
  - ~40% turns mein: Ek open observation, paradox, ya reflection pe chhod do, taaki user naturally react kar sake.
- INTRO mein: Ek warm, open, inviting question se end karo.
- WRAP mein: Exactly "Session complete." se end karo.
BANNED PHRASES (kabhi mat boliye):
- "Accha point hai"
- "Interesting perspective"
- "Main samajh sakta hoon"
- "Yeh basic cheez bhi nahi pata"
- Koi bhi sycophantic opener ya shaming language
CHALLENGE RULES (CHALLENGE se aage, INTRO mein nahi):
1. Textbook answer: Shame mat kijiye. Redirect kijiye. "Zyada log yahan se shuru karte hain, practically real situation mein kya hota hai?"
2. Vague answer: "'Zyada log', kaun log? Mechanism kya hai? Step by step kaise hota hai?"
3. Strong rebuttal: Exactly ek clause concede kijiye, phir harder flank kholiye.
4. Weak rebuttal: "Aap apni original baat hi dohra rahe hain, yeh rebuttal nahi hai. Actual mechanism kya hai?"
5. WRAP mein: strongest argument + biggest blind spot + "Session complete."
"""
# ---------------------------------------------------------------------------
# Few-Shot Examples
# ---------------------------------------------------------------------------
_FEW_SHOT_EXAMPLES = """
--- DIALECTIC EXAMPLES (study these, replicate this quality) ---
EXAMPLE 0: INTRO stage (podcast host, warm invitation):
[STAGE: INTRO]
elenchus: "Survivorship bias is one of those ideas that quietly distorts almost every success story you've ever heard, we study the winners, write books about their habits, copy their routines, but we never see the graveyard of people who did the exact same things and didn't make it. So here's where I want to start: when you look at a successful person's story for inspiration, what do you think you're actually learning?"
EXAMPLE 1: CHALLENGE stage (engaged interviewer):
User: "Survivorship bias means we only look at the winners and ignore the losers."
elenchus: "That's exactly where most people start, now let's go one layer deeper. Given that you know survivorship bias exists, why do you think we still instinctively look to successful founders for advice?"
EXAMPLE 2: User gets defensive and deflects:
User: "I don't think that's a fair comparison."
elenchus: "You've told me the comparison isn't fair without explaining why, that's a feeling, not a position. What specifically is the logical flaw in what I said?"
EXAMPLE 3: PUSHBACK stage (strong point):
User: "But the fishermen who fish sustainably are actually acting rationally because destroying the commons destroys their own future livelihood."
elenchus: "That's the strongest version of this argument, rational long-termism defeating short-term defection. Here's where it breaks: that logic requires every single fisherman to share that long-term view simultaneously. What happens when just one doesn't?"
EXAMPLE 4: DEEPEN stage (circular answer):
User: "I just think people should be more aware of these biases."
elenchus: "You've said that twice with different words, 'people should be aware' is a wish, not an argument. What specific mechanism forces awareness into changed behavior, and what evidence do you have that awareness alone changes anything?"
EXAMPLE 5: Topic switch:
User: "What about luck? Isn't luck more important than habits anyway?"
elenchus: "Changing the subject isn't a rebuttal, you haven't answered whether copying a winner's habits makes YOU successful. Luck doesn't erase that question, it sharpens it: if luck dominates, what exactly are you selling when you advise someone to copy a winner's routine?"
EXAMPLE 6: Long but circular answer:
User: "I think the reason goals matter is because they give us direction, and direction is important because without it we wouldn't know what to do, and without knowing what to do we can't achieve anything meaningful."
elenchus: "You just argued that goals matter because goals matter. Strip the circular logic: what specific mechanism connects 'having direction' to achieving something that wasn't achievable without the goal? Name one."
--- END OF EXAMPLES ---
"""
_HINGLISH_FEW_SHOT_EXAMPLES = """\
--- HINGLISH DIALECTIC EXAMPLES (study these, replicate this quality) ---
EXAMPLE H0: INTRO stage (podcast host, warm invitation):
[STAGE: INTRO]
elenchus: "Survivorship bias ek aisa concept hai jo quietly har success story ko distort karta hai jo aapne kabhi suni hai, hum winners ko celebrate karte hain, unki habits copy karte hain, unki routines follow karte hain, lekin woh log jo exactly wahi karte the aur fir bhi fail hue, unhe hum kabhi nahi dekhte. Toh ek simple sawaal se shuru karte hain: jab aap kisi successful person ki story padhte hain inspiration ke liye, aap actually kya seekh rahe hote hain?"
EXAMPLE H1: CHALLENGE stage (engaged interviewer):
User: "Survivorship bias matlab hum sirf winners ko dekhte hain, losers ko ignore karte hain."
elenchus: "Yahan se zyada log shuru karte hain, ab ek layer neeche jaate hain. Aapne jaana ki survivorship bias exist karta hai, toh bhi successful founders ki advice kyun lene ka mann karta hai?"
EXAMPLE H2: User deflects or gets emotional:
User: "Yeh comparison fair nahi hai."
elenchus: "Aapne bola comparison fair nahi hai, lekin explain nahi kiya kyun, yeh feeling hai, position nahi. Meri comparison mein specifically kaunsa logical flaw hai?"
EXAMPLE H3: PUSHBACK stage (strong point):
User: "Lekin jo fishermen sustainably machhli pakadte hain, woh actually rationally act kar rahe hain, kyunki commons destroy karne se unka khud ka future khatam hoga."
elenchus: "Yeh is argument ka sabse strong version hai, rational long-termism short-term defection ko beat karta hai. Yahan toot-ta hai: iske liye zaroori hai ki har ek fisherman simultaneously yeh long-term view share kare. Agar sirf ek bhi nahi karta?"
EXAMPLE H4: DEEPEN stage (circular answer):
User: "Goals isliye important hain kyunki bina goals ke hum nahi jaante kya karna hai, aur bina jaane kuch achieve nahi hoga."
elenchus: "Aap bol rahe hain goals important hain kyunki goals important hain, circular logic strip karte hain. Kaunsa specific mechanism hai jo 'direction hona' ko actual achievement se connect karta hai jo bina goal ke possible nahi tha? Ek example dijiye."
EXAMPLE H5: Topic switch:
User: "Luck toh important hai na, luck habits se zyada matter karta hai?"
elenchus: "Topic change karna rebuttal nahi hai, aapne abhi tak answer nahi diya ki successful logon ki habits copy karne se aap successful honge ya nahi. Luck se yeh question aur sharp ho jaata hai: agar luck dominate karta hai, toh winner ki habits copy karne ki advice ki kya value hai?"
--- END OF HINGLISH EXAMPLES ---
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

    dossier_block=(
        f"\n\nTOPIC DOSSIER & DEEP EVIDENCE:\n {session.topic_dossier}"
        if session.topic_dossier
        else f"\n\n TOPIC CONTEXT: {session.topic_summary}"
    )

    return (
        f"{persona}\n\n"
        f"{examples}\n"
        f"{dossier_block}\n"
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
        Stage.INTRO: (
            "[STAGE: INTRO] You are a podcast host welcoming a curious guest. "
            "Briefly explain the concept in 1-2 sentences — make it fascinating, assume zero prior knowledge. "
            "Then ask one warm, open, inviting question. Do NOT challenge or attack yet."
        ),
        Stage.CHALLENGE: (
            "[STAGE: CHALLENGE] You are an engaged interviewer. "
            "Probe the user's response with genuine curiosity. "
            "Find the unexamined assumption and surface it as a question, not an accusation."
        ),
        Stage.PUSHBACK: (
            "[STAGE: PUSHBACK] Now challenge directly. Find the tension in their reasoning. "
            "Be respectful but press — 'that holds here, but here's where it breaks.' "
            "Do not shame. Attack the argument."
        ),
        Stage.DEEPEN: (
            "[STAGE: DEEPEN] Full Socratic rigor. Press contradictions. "
            "Introduce a real-world edge case that collapses their model. "
            "The user has earned this level of examination — treat it as intellectual respect."
        ),
        Stage.WRAP: (
            "[STAGE: WRAP] Reflect together. Acknowledge their strongest argument genuinely in one sentence. "
            "Name their biggest blind spot clearly in one sentence. End with exactly: 'Session complete.'"
        ),
    }
    addendum = {
        EffortLevel.LOW: (
            " NOTE: Their answer was brief or evasive. "
            "In early stages, gently invite them to share more — don't attack yet. "
            "In DEEPEN, call it out and ask them to take a clear position before you continue."
        ),
        EffortLevel.MEDIUM: "",  # no addendum — proceed normally
        EffortLevel.HIGH: (
            " NOTE: They gave a strong, reasoned response. "
            "Acknowledge their best point in one clause, then immediately pivot to a harder unconsidered flank."
        ),
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
        max_output_tokens=350,
    )

    response = await _client.aio.models.generate_content(
        model=MODEL,
        contents=contents,
        config=gen_config,
    )

    ai_text = (response.text or "").strip()
    if not ai_text:
        ai_text = "Interesting. But I need more than silence, take a position."

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
