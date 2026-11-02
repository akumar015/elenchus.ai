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

MODEL= "gemini-3.5-flash-lite"

# Structured Dialogue Response Schemas (Strict JSON Schema for Gemini)

class DialogueSegment(BaseModel):
    speaker: Literal["Host1", "Host2"]= Field(
        description= "The host speaking. Host1 is Anchor (Kalpana/Shivani), host2 is Provocateur (Avinash)."
    )
    voice: Literal["Kalpana","Shivani","Avinash"]= Field(
        description="Voice ID to synthesize: 'Kalpana' (Host1 EN), 'Shivani' (Host1 HI), 'Avinash' (Host2)."
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
    language: str= "en-IN"      #"en-IN" | "hi_IN"
    history: list[dict]= field(default_factory=list)  #[{"role: "Host1"|"Host2"|"Guest", "text":"..."}]
    turn_count: int= 0
    is_complete: bool= False


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
Aap 'elenchus Studio' ke director aur writers hain — ek intellectual Hinglish podcast.
Aap do AI co-hosts aur ek live human GUEST ke beech natural, authentic Hinglish conversation script karte hain.
CAST:
1. HOST 1 (Anchor — Voice: 'Shivani'):
   - Role: The Conceptual Thinker & Storyteller.
   - Tone: Warm, curious, articulate. Natural, respectful Hinglish.
   - Job: Dossier se historical facts, Abraham Wald jaise real cases aur paradoxes introduce karti hai. Guest ko comfortably involve karti hai.
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Pragmatic Challenger & Devil's Advocate.
   - Tone: Energetic, practical, thoda skeptical, real-world perspective.
   - Job: Shivani ki academic baaton pe counter karta hai. Bolta hai practical world mein textbook logic fail hoti hai. Guest se unka stance poochta hai.
3. THE GUEST (The User):
   - Hamara guest hai. Unhe interrogate ya grill KABHI mat kijiye.
   - Host 1 aur Host 2 aapas mein debate karte hain, aur guest ko invite karte hain: "Aap kiski side le rahe hain?"
PACING RULES:
- Har turn mein 1 ya 2 segments hone chahiye (Host 1 then Host 2, ya Host 2 then Host 1).
- Har segment 2-4 sentences ka ho. Natural, conversational Hinglish (na poori Hindi, na poori English).
- Fluff intro mat boliye ("Aaj ke episode mein..."). Seedha core tension aur mudde pe aaiye.
"""


# Enigne Functions
_client= genai.Client(api_key=settings.google_api_key)


def _build_system_instruction(session: PodcastSession)-> str:
    base= STUDIO_PROMPT_HI if session.language== "hi-IN" else STUDIO_PROMPT_EN
    dossier= session.topic_dossier or session.topic_summary

    return(
        f"{base}\n\n"
        f"--- TOPIC DOSSIER & BACKGROUND EVIDENCE ---\n"
        f"Topic: {session.topic_title}\n"
        f"{dossier}\n"
        f"--- END OF DOSSIER ---\n"
    )

def _build_conversation_contents(session: PodcastSession, guest_input: str)-> list[types.Content]:
    contents: list[types.Content]= []

    # Map previous multi-speaker turns into gemini content history
    for entry in session.history:
        role= "user" if entry['role']== "Guest" else "model"
        speaker_tag= f"[{entry['role']}]: " if entry['role'] != "Guest" else "Guest: "
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
)-> PodcastTurn:
    """
    Process guest input and generate the next multi-host dialogue turn.
    Returns a strictly validated PodcastTurn Pydantic object.
    """
    guest_input= guest_input.strip() or "Let's dive into the topic."

    # Record guest turn in session history (unless it's the synthetic start)
    if session.turn_count> 0:
        session.history.append({"role": "Guest", "text": guest_input})

    contents= _build_conversation_contents(session, guest_input)
    sys_instruction= _build_system_instruction(session)

    # Gemini with native JSON schema output
    gen_config= types.GenerateContentConfig(
        system_instruction=sys_instruction,
        temperature=0.85,
        response_mime_type="application/json",
        response_schema=PodcastTurn,
        max_output_tokens=800,
    )

    response=await _client.aio.models.generate_content(
        model=MODEL,
        contents=contents,
        config=gen_config,
    )

    raw_json= response.text or"{}"
    turn = PodcastTurn.model_validate_json(raw_json)

    # Fallback voice assignment guard
    default_host1_voice= "Shivani" if session.language== "hi-IN" else "Kalpana"
    for seg in turn.dialogue:
        if seg.speaker== "Host1":
            seg.voice= default_host1_voice
        elif seg.speaker== "Host2":
            seg.voice= "Avinash"

        # Record host dialogue in session history
        session.history.append({"role": seg.speaker, "text": seg.text})

    session.turn_count +=1
    session.is_complete= turn.is_complete

    return turn