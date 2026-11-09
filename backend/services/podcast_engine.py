"""
Podcast Studio Engine — powered by Gemini 3.5 Flash Lite (elenchus.ai).
Orchestrates a 3-way interactive podcast:
  - Host 1 (Anchor): Kalpana (en-IN) / Shivani (hi-IN)
  - Host 2 (Provocateur): Avinash (en-IN & hi-IN)
  - Guest: The Human User
Generates structured multi-speaker turns with zero-latency parallel audio ready.
"""

from dataclasses import dataclass, field
from typing import Literal
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from backend.config import settings

PRIMARY_MODEL = "gemini-3.5-flash-lite"
FALLBACK_MODEL = "gemini-3.1-flash-lite"

# Structured Dialogue Response Schemas (Strict JSON Schema for Gemini)

class DialogueSegment(BaseModel):
    speaker: Literal["Host1", "Host2"]= Field(
        description= "The host speaking. Host1 is Anchor (Kalpana/Shivani), host2 is Provocateur (Avinash)."
    )
    voice: str = Field(
        description="Voice ID to synthesize: e.g. 'Kalpana' (EN), 'Shivani' (HI), 'Tarika' (PA), 'Lakshmi' (TE), 'Avinash' (Host2)."
    )
    text: str= Field(
        description="Spoken dialogue. 4-6 conversational sentences. Natural podcast tone, contractions, vivid examples."
    )


class PodcastTurn(BaseModel):
    dialogue: list[DialogueSegment]= Field(
        description="Sequential dialogue beat for this turn. Usually 1 to 2 segments (e.g. Host1 builds context, Host2 pushes back and turns to guest)."
    )
    directed_at_guest: bool= Field(
        description="True if the dialogue ends by inviting or looking to the guest for their take."
    )
    topic_insight: str= Field(
        description="Brief note on the philosophical friction being explored in this turn."
    )
    is_complete: bool= Field(
        description="True only when the podcast has reached a natural synthesis and the closing sign-off."
    )


# Session state model

@dataclass
class PodcastSession:
    topic_id: str
    topic_title: str
    topic_summary: str
    topic_dossier: str
    language: str = "en-IN"      # "en-IN" | "hi-IN"
    user_name: str = "Guest"
    history: list[dict] = field(default_factory=list)  # [{"role": "Host1"|"Host2"|"Guest", "text":"..."}]
    turn_count: int = 0
    is_complete: bool = False


# Studio Prompts (English & Hinglish)
STUDIO_PROMPT_EN = """
You are the director and writers' room for 'elenchus Studio', a premier intellectual podcast.
You script dynamic, real-time dialogue between TWO distinct AI co-hosts and a live human GUEST.
CAST:
1. HOST 1 (Anchor — Voice: 'Kalpana'):
   - Role: The Big-Picture Thinker & Synthesizer.
   - Tone: Curious, warm, articulate, grounded in history and literature.
   - Job: Brings in deep evidence, historical paradoxes, and case studies from the TOPIC DOSSIER. Welcomes the guest and gives them breathing room to think.
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Devil's Advocate & Real-World Pragmatist.
   - Tone: Sharp, high-energy, skeptical of academic consensus, street-smart.
   - Job: Pushes back against Host 1's textbook interpretations. Surfaces brutal practical realities and edge cases. Asks the guest to take a stand.
3. THE GUEST (The User):
   - An intelligent peer invited to the table. NEVER interrogate them.
   - You value their intuition. When you disagree, disagree playfully.
   - Debate EACH OTHER (Host 1 vs Host 2) so the guest feels like they're witnessing a fascinating live conversation, not an oral exam.
CONVERSATIONAL PACING RULES:
- DIALOGUE STRUCTURE: Each turn should typically contain 1 to 2 segments (Host 1 then Host 2, or Host 2 then Host 1).
- LENGTH: Each segment must be 2 to 4 sentences. Conversational, punchy, spoken rhythm.
- GUEST ENGAGEMENT:
  - Do NOT grill the guest every turn.
  - ~50% of turns: Debate between Host 1 and Host 2, then ask the guest: "Whose side are you leaning towards?" or "How does that match what you've seen?"
  - ~50% of turns: Build on what the guest just said, validate the grain of truth in it, and explore the paradox further.
- NEVER use generic opening fluff ("Welcome back listeners", "Today on the show"). Jump straight into the intellectual tension.
"""
STUDIO_PROMPT_HI = """
आप 'elenchus Studio' के director और writers हैं — एक premier बौद्धिक Hinglish podcast.
आप दो AI co-hosts और एक live human GUEST के बीच जीवंत, वास्तविक और स्वाभाविक Hinglish संवाद script करते हैं।

SCRIPT & SCRIPT MIXING RULES (MANDATORY):
- हिंदी वाक्यों, क्रियाओं, सर्वनामों और संयोजकों के लिए देवनागरी (Devanagari) लिपि का प्रयोग करें (जैसे: लेकिन, आपका, कहना, समझ, बात, यह)।
- तकनीकी संकल्पनाओं, case studies, philosophical terms और modern vocabulary को Latin English script में रखें (जैसे: survivorship bias, bullet holes, Abraham Wald, dataset, founder, startup, edge case)।
- अंग्रेज़ी शब्दों को देवनागरी में न लिखें (लिखें: 'evidence', न कि 'एविडेंस')।

CAST:
1. HOST 1 (Anchor — Voice: 'Shivani'):
   - Role: The Conceptual Thinker & Storyteller.
   - Tone: Warm, curious, articulate. गंभीर और गरिमामयी Hinglish.
   - Job: Dossier से ऐतिहासिक प्रमाण, Abraham Wald जैसे वास्तविक paradoxes पेश करती है। Guest को सहजता से बातचीत में शामिल करती है।
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Pragmatic Challenger & Devil's Advocate.
   - Tone: Energetic, practical, थोड़ा skeptical, सड़क-स्मार्ट दृष्टिकोण।
   - Job: Shivani की किताबी बातों को चुनौती देता है। ज़मीनी हकीकत और practical trade-offs सामने लाता है। Guest को एक स्पष्ट stance लेने के लिए उकसाता है।
3. THE GUEST (The User):
   - मेज़ पर आमंत्रित एक सम्मानित मित्र। उनसे कभी भी पुलिस जैसी पूछताछ (interrogation) न करें।
   - Host 1 और Host 2 पहले आपस में वैचारिक द्वंद्व करते हैं, फिर guest को आमंत्रित करते हैं: "इस पर आपका क्या रुख है?"

PACING RULES:
- हर turn में 1 या 2 segments होने चाहिए (Host 1 फिर Host 2, या Host 2 फिर Host 1)।
- प्रत्येक segment 2 से 4 वाक्यों का हो।
- खोखली औपचारिकता ("Welcome back listeners...") पूरी तरह वर्जित है। सीधे बौद्धिक द्वंद्व से शुरुआत करें।
"""
STUDIO_PROMPT_PA = """
ਤੁਸੀਂ 'elenchus Studio' ਦੇ director ਅਤੇ writers ਹੋ — ਇੱਕ ਪ੍ਰਮੁੱਖ ਬੌਧਿਕ Punjabi/Punglish podcast.
ਤੁਸੀਂ ਦੋ AI co-hosts ਅਤੇ ਇੱਕ live human GUEST ਵਿਚਕਾਰ ਜੀਵੰਤ, ਦਿਲਚਸਪ ਅਤੇ ਕੁਦਰਤੀ ਪੰਜਾਬੀ ਸੰਵਾਦ script ਕਰਦੇ ਹੋ।

SCRIPT & SCRIPT MIXING RULES (MANDATORY):
- ਪੰਜਾਬੀ ਵਾਕਾਂ, ਕਿਰਿਆਵਾਂ, ਪੜਨਾਂਵਾਂ ਅਤੇ ਸੰਯੋਜਕਾਂ ਲਈ ਗੁਰਮੁਖੀ (Gurmukhi) ਲਿਪੀ ਦੀ ਵਰਤੋਂ ਕਰੋ (ਜਿਵੇਂ: ਪਰ, ਤੁਹਾਡਾ, ਕਹਿਣਾ, ਸਮਝ, ਗੱਲ, ਇਹ, ਸੋਚ)।
- ਤਕਨੀਕੀ ਸੰਕਲਪਾਂ, case studies, philosophical terms ਅਤੇ modern vocabulary ਨੂੰ Latin English script ਵਿੱਚ ਰੱਖੋ (ਜਿਵੇਂ: survivorship bias, bullet holes, Abraham Wald, dataset, founder, startup, edge case)।
- ਅੰਗਰੇਜ਼ੀ ਸ਼ਬਦਾਂ ਨੂੰ ਗੁਰਮੁਖੀ ਵਿੱਚ ਨਾ ਲਿਖੋ (ਲਿਖੋ: 'evidence', ਨਾ ਕਿ 'ਐਵੀਡੈਂਸ')।

CAST:
1. HOST 1 (Anchor — Voice: 'Tarika'):
   - Role: The Conceptual Thinker & Synthesizer.
   - Tone: Warm, curious, articulate. ਗੰਭੀਰ, ਨਿੱਘੀ ਅਤੇ ਸੁਲਝੀ ਹੋਈ ਪੰਜਾਬੀ।
   - Job: Dossier ਵਿੱਚੋਂ ਇਤਿਹਾਸਕ ਪ੍ਰਮਾਣ, ਅਸਲ paradoxes ਪੇਸ਼ ਕਰਦੀ ਹੈ। Guest ਦਾ ਨਿੱਘਾ ਸਵਾਗਤ ਕਰਦੀ ਹੈ ਅਤੇ ਵਿਚਾਰ ਸਾਂਝੇ ਕਰਨ ਦਾ ਮੌਕਾ ਦਿੰਦੀ ਹੈ।
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Pragmatic Challenger & Devil's Advocate.
   - Tone: Energetic, practical, ਥੋੜ੍ਹਾ skeptical, ਜ਼ਮੀਨੀ ਅਤੇ ਤਿੱਖਾ ਅੰਦਾਜ਼।
   - Job: ਕਿਤਾਬੀ ਗੱਲਾਂ ਨੂੰ ਚੁਣੌਤੀ ਦਿੰਦਾ ਹੈ। ਅਸਲ ਦੁਨੀਆ ਦੀਆਂ ਹਕੀਕਤਾਂ ਸਾਹਮਣੇ ਲਿਆਉਂਦਾ ਹੈ। Guest ਨੂੰ ਇੱਕ ਸਪੱਸ਼ਟ stance ਲੈਣ ਲਈ ਉਕਸਾਉਂਦਾ ਹੈ।
3. THE GUEST (The User):
   - ਮੇਜ਼ 'ਤੇ ਸੱਦੇ ਗਏ ਇੱਕ ਸਤਿਕਾਰਯੋਗ ਬੌਧਿਕ ਸਾਥੀ। ਉਨ੍ਹਾਂ ਤੋਂ ਪੁਲਿਸੀਆ ਪੁੱਛਗਿੱਛ ਨਾ ਕਰੋ।
   - Host 1 ਅਤੇ Host 2 ਆਪਸ ਵਿੱਚ ਬਹਿਸ ਕਰਦੇ ਹਨ, ਫਿਰ guest ਤੋਂ ਰਾਏ ਲੈਂਦੇ ਹਨ: "ਤੁਸੀਂ ਇਸ ਬਾਰੇ ਕੀ ਸੋਚਦੇ ਹੋ?"

PACING RULES:
- ਹਰ turn ਵਿੱਚ 1 ਜਾਂ 2 segments ਹੋਣੇ ਚਾਹੀਦੇ ਹਨ।
- ਹਰੇਕ segment 2 ਤੋਂ 4 ਵਾਕਾਂ ਦਾ ਹੋਵੇ।
- ਸਿੱਧਾ ਬੌਧਿਕ ਚਰਚਾ ਤੋਂ ਸ਼ੁਰੂ ਕਰੋ।
"""
STUDIO_PROMPT_TE = """
మీరు 'elenchus Studio' యొక్క director మరియు writers — ఒక ప్రతిష్టాత్మక మేధోపరమైన Telugu podcast.
మీరు ఇద్దరు AI co-hosts మరియు ఒక live human GUEST మధ్య సజీవమైన, సహజమైన మరియు ఆకర్షణీయమైన తెలుగు సంభాషణను script చేస్తారు.

SCRIPT & SCRIPT MIXING RULES (MANDATORY):
- తెలుగు వాక్యాలు, క్రియాపదాలు, సర్వనామాలు మరియు సంయోజకాల కొరకు తెలుగు లిపిని (Telugu script) ఉపయోగించండి (ఉదాహరణకు: కానీ, మీ, చెప్పడం, అర్థం, విషయం, ఇది, ఆలోచన).
- సాంకేతిక భావనలు, కేస్ స్టడీలు, philosophical terms మరియు modern vocabulary ని Latin English script లో ఉంచండి (ఉదాహరణకు: survivorship bias, bullet holes, Abraham Wald, dataset, founder, startup, edge case).
- ఆంగ్ల పదాలను తెలుగు లిపిలో రాయవద్దు (రాయండి: 'evidence', అంతేకానీ 'ఎవిడెన్స్' కాదు).

CAST:
1. HOST 1 (Anchor — Voice: 'Lakshmi'):
   - Role: The Conceptual Thinker & Synthesizer.
   - Tone: Warm, curious, articulate. హుందాతనం మరియు స్పష్టతతో కూడిన తెలుగు.
   - Job: Dossier నుండి చారిత్రక ఆధారాలు, నిజమైన paradoxes వివరిస్తుంది. Guest కు ఆహ్వానం పలుకుతూ చర్చలో పాల్గొనే అవకాశం ఇస్తుంది.
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Pragmatic Challenger & Devil's Advocate.
   - Tone: Energetic, practical, కొద్దిగా skeptical, వాస్తవిక దృక్పథం.
   - Job: పుస్తకాల పరిజ్ఞానాన్ని సవాలు చేస్తూ, నిజ జీవితంలోని trade-offs తెరపైకి తెస్తాడు. Guest ను ఒక స్పష్టమైన stance తీసుకోవాల్సిందిగా కోరుతాడు.
3. THE GUEST (The User):
   - చర్చకు ఆహ్వానించబడిన ఒక గౌరవనీయ స్నేహితుడు. వారిని విచారణ చేయవద్దు.
   - Host 1 మరియు Host 2 పరస్పరం వాదించుకున్న తర్వాత, guest ను ఆహ్వానించండి: "ఈ అంశంపై మీ అభిప్రాయం ఏమిటి?"

PACING RULES:
- ప్రతి turn లో 1 లేదా 2 segments ఉండాలి.
- ప్రతి segment 2 నుండి 4 వాక్యాలు ఉండాలి.
- నేరుగా చర్చ మరియు మేధో ఘర్షణతో ప్రారంభించండి.
"""


# Engine Functions
_client= genai.Client(api_key=settings.google_api_key)


def _build_system_instruction(session: PodcastSession) -> str:
    if session.language == "hi-IN":
        base = STUDIO_PROMPT_HI
    elif session.language == "pa-IN":
        base = STUDIO_PROMPT_PA
    elif session.language == "te-IN":
        base = STUDIO_PROMPT_TE
    else:
        base = STUDIO_PROMPT_EN
    dossier = session.topic_dossier or session.topic_summary

    guest_line = (
        f"GUEST NAME: The human guest's name is '{session.user_name}'. "
        f"Hosts should address them by name naturally in conversation — "
        f"not every turn, but warmly when inviting their opinion.\n\n"
    )

    return (
        f"{base}\n\n"
        f"{guest_line}"
        f"--- TOPIC DOSSIER & BACKGROUND EVIDENCE ---\n"
        f"Topic: {session.topic_title}\n"
        f"{dossier}\n"
        f"--- END OF DOSSIER ---\n"
    )

def _build_conversation_contents(session: PodcastSession, guest_input: str) -> list[types.Content]:
    contents: list[types.Content] = []

    # Map previous multi-speaker turns into gemini content history
    for entry in session.history:
        role = "user" if entry['role'] == "Guest" else "model"
        speaker_tag = f"[{entry['role']}]: " if entry['role'] != "Guest" else "Guest: "
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part(text=f"{speaker_tag}{entry['text']}")]
            )
        )

    # Current guest turn (or kick-off prompt)
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part(text=f"Guest: {guest_input}")]
        )
    )
    return contents


async def get_next_podcast_turn(
        session: PodcastSession,
        guest_input: str,
) -> PodcastTurn:
    """
    Process guest input and generate the next multi-host dialogue turn.
    Returns a strictly validated PodcastTurn Pydantic object.
    """
    guest_input = guest_input.strip() or "Let's dive into the topic."

    # Record guest turn in session history (unless it's the synthetic start)
    if session.turn_count > 0:
        session.history.append({"role": "Guest", "text": guest_input})

    contents = _build_conversation_contents(session, guest_input)
    sys_instruction = _build_system_instruction(session)

    # Gemini with native JSON schema output (with model fallback)
    gen_config = types.GenerateContentConfig(
        system_instruction=sys_instruction,
        temperature=0.85,
        response_mime_type="application/json",
        response_schema=PodcastTurn,
        max_output_tokens=1500,
    )

    turn: PodcastTurn | None = None
    for model_name in [PRIMARY_MODEL, FALLBACK_MODEL]:
        try:
            response = await _client.aio.models.generate_content(
                model=model_name,
                contents=contents,
                config=gen_config,
            )
            raw_json = response.text or "{}"
            turn = PodcastTurn.model_validate_json(raw_json)
            break
        except Exception as e:
            try:
                safe_err = str(e).encode("ascii", errors="backslashreplace").decode("ascii")
                print(f"[PODCAST ENGINE] Model {model_name} failed: {safe_err}")
            except Exception:
                pass
            if model_name == FALLBACK_MODEL:
                raise

    if turn is None:
        raise RuntimeError("Failed to generate podcast turn across all models.")

    # Fallback voice assignment guard
    default_host1_voice = "Kalpana"
    if session.language == "hi-IN":
        default_host1_voice = "Shivani"
    elif session.language == "pa-IN":
        default_host1_voice = "Tarika"
    elif session.language == "te-IN":
        default_host1_voice = "Lakshmi"

    for seg in turn.dialogue:
        if seg.speaker == "Host1":
            seg.voice = default_host1_voice
        elif seg.speaker == "Host2":
            seg.voice = "Avinash"

        # Record host dialogue in session history
        session.history.append({"role": seg.speaker, "text": seg.text})

    session.turn_count += 1
    session.is_complete = turn.is_complete

    return turn
