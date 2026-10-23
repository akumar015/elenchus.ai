"""
Ambient Scribe Engine — elenchus.ai
Extracts a structured ThoughtCard from a completed sparring session's
tagged conversation history using Gemini 3.5 Flash Lite.
"""

import json
import re
import logging
from pydantic import BaseModel
from google import genai
from google.genai import types
from backend.config import settings

logger = logging.getLogger(__name__)

MODEL= "gemini-3.1-flash-lite"

_client= genai.Client(api_key=settings.google_api_key)

# Output Schema
class ThoughtCard(BaseModel):
    core_thesis: str 
    user_stance: str 
    blind_spots: str 
    key_insights: str


# Prompt
_SCRIBE_SYSTEM = """\
You are the Ambient Scribe for elenchus.ai — a Socratic sparring engine.
You receive a tagged conversation log between an AI (Socratic adversary) and a USER (debater).
Your job is to produce a precise, analytical "Atomic Thought Card" — a post-debate synthesis.
OUTPUT: Valid JSON only. No markdown fences. No commentary. No extra keys.
Schema:
{
  "core_thesis": "<2-sentence objective explanation of the concept debated — not what the user said, but what the concept IS>",
  "user_stance": "<1-2 sentence synthesis of the user's actual position and how they argued it>",
  "blind_spots": "<1-3 specific logical fallacies, unbacked premises, or inconsistencies the user revealed — be precise, not generic>",
  "key_insight": "<The single sharpest intellectual takeaway from this particular debate — something a reader would find genuinely illuminating>"
}
Rules:
- core_thesis must be topic-accurate, not a paraphrase of the user.
- blind_spots must cite concrete moments from the conversation. Not vague phrases like "logical fallacy".
- key_insight must be specific to this debate, not a generic platitude.
- If the conversation is too short or incoherent to produce a meaningful card, fill each field with the best possible inference — never return empty strings or null.
- Always respond in the same language/register as the USER's messages.
"""


def _build_transcript(history: list[dict])-> str:
    """Convert tagged history to a readable transcript for the scribe"""

    lines=[]
    for turn in history:
        role=turn.get("role", "?")
        text=turn.get("text", "").strip()
        lines.append(f"[{role}]: {text}")

    return "\n".join(lines)


def _repair_json(raw: str)-> str:
    """
    Best-effort extraction of a JSON object from a potentially
    markdown-wrapped or partially malformed LLM response.
    """

    # Strip markdown fences if present
    raw= re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw.strip())

    # Try to extract the first {...} block
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return match.group(0)
    return raw


# Main Extraction function
async def generate_thought_card(
        topic_id: str,
        topic_summary: str,
        history: list[dict],
        language: str = 'en-IN',
    )-> ThoughtCard:

    """
    Calls Gemini to extract a ThoughtCard from the session history.
    Args:
        topic_id:       e.g. "survivorship-bias"
        topic_summary:  Short description of the topic from topics.json
        history:        List of {"role": "AI"|"USER", "text": "..."} dicts
        language:       Session language code (informational)
    Returns:
        ThoughtCard instance (Pydantic model)
    """

    transcript= _build_transcript(history)

    user_prompt= f"""\
Topic: {topic_summary}
Language: {language}
Turns: {len(history)}
--- CONVERSATION TRANSCRIPT ---
{transcript}
--- END TRANSCRIPT ---
Generate the Atomic Thought Card JSON now.
"""

    try:
        response= await _client.aio.models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction= _SCRIBE_SYSTEM,
                temperature= 0.2,
                max_output_tokens=512,
            ),
        )
        raw= (response.text or "").strip()
        logger.debug("Scribe raw response: %s", raw)

    except Exception as exc:
        logger.error("Scribe Gemini call failed: %s", exc)
        #return a graceful fallback card rather than crashing 
        return ThoughtCard(
            core_thesis=f"A debate on: {topic_summary}",
            user_stance="Unable to synthesize",
            blind_spots="Analysis unavailable",
            key_insights="Not available"
        )

    # Parse JSON
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        repaired = _repair_json(raw)
        try:
            parsed = json.loads(repaired)
        except json.JSONDecodeError:
            logger.error("Scribe JSON parse failed even after repair. Raw: %s", raw)
            return ThoughtCard(
                core_thesis=f"A debate on: {topic_summary}",
                user_stance="Parse error — could not extract stance.",
                blind_spots="Parse error — could not extract blind spots.",
                key_insights="Parse error — could not extract key insight.",
            )
    # Validate with Pydantic
    try:
        card = ThoughtCard(**parsed)
    except Exception as exc:
        logger.error("ThoughtCard validation failed: %s | parsed=%s", exc, parsed)
        # Fill missing fields with safe defaults
        card = ThoughtCard(
            core_thesis=parsed.get("core_thesis", f"A debate on: {topic_summary}"),
            user_stance=parsed.get("user_stance", "Unable to determine stance."),
            blind_spots=parsed.get("blind_spots", "Unable to determine blind spots."),
            key_insights=parsed.get("key_insight", "Unable to determine key insight."),
        )
    return card
    


