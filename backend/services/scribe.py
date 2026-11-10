"""
Ambient Scribe Engine — elenchus.ai
Extracts a structured ThoughtCard from a completed sparring or podcast session's
tagged conversation history using Gemini 3.5 Flash Lite.
"""

import json
import re
import logging
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from backend.config import settings

logger = logging.getLogger(__name__)

PRIMARY_MODEL = "gemini-3.5-flash-lite"
FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]
CANDIDATE_MODELS = [PRIMARY_MODEL] + FALLBACK_MODELS

_client = genai.Client(api_key=settings.google_api_key)

# Output Schema
class ThoughtCard(BaseModel):
    core_thesis: str
    user_stance: str
    blind_spots: str
    key_insight: str


# Prompt
_SCRIBE_SYSTEM = """\
You are the Ambient Scribe for elenchus.ai — a dual-engine Socratic sparring arena and philosophical podcast studio.
You receive a tagged conversation transcript from either:
1) A 1-on-1 Socratic duel between an [AI] cross-examiner and a [USER] debater, OR
2) A 3-way roundtable podcast between [Host1] (Anchor), [Host2] (Provocateur), and [USER] (Guest Thinker).

Your objective is to produce a precise, analytical "Atomic Thought Card" — a permanent intellectual synthesis analyzing the human [USER]'s articulated worldview, logical consistency, and the ideas explored.

OUTPUT: Valid JSON only. No markdown fences. No commentary. No extra keys.
Schema:
{
  "core_thesis": "<2-sentence objective explanation of the concept or paradox debated — not what the user said, but what the concept IS>",
  "user_stance": "<1-2 sentence synthesis of the user's actual position, stated premises, and how they defended them against challenges or co-host provocations>",
  "blind_spots": "<1-3 specific logical assumptions, unbacked premises, or inconsistencies the user revealed — be precise and grounded in dialogue, not generic platitudes>",
  "key_insight": "<The single sharpest intellectual takeaway from this specific debate — something a reader would find genuinely illuminating>"
}
Rules:
- core_thesis must be topic-accurate, objective, and clear.
- user_stance must accurately capture what the human [USER] argued (or conceded), distinguishing them from [Host1] and [Host2].
- blind_spots must cite concrete moments or contradictions from the conversation. Not vague phrases like "logical fallacy".
- key_insight must be specific to this debate, not a generic platitude.
- If the conversation is short, fill each field with the best possible analytical inference — never return empty strings or null.
- Always respond in the same language/register as the conversation:
  * For English (en-IN): Standard articulate English prose.
  * For Hinglish (hi-IN): Authentic Devanagari script for Hindi prose and Latin script for technical English concepts.
  * For Punjabi (pa-IN): Authentic Gurmukhi script for Punjabi prose and Latin script for technical English concepts.
  * For Telugu (te-IN): Authentic Telugu script for Telugu prose and Latin script for technical English concepts.
"""


def _build_transcript(history: list[dict]) -> str:
    """Convert tagged history to a readable transcript for the scribe"""
    lines = []
    for turn in history:
        role = turn.get("role", "?")
        text = turn.get("text", "").strip()
        lines.append(f"[{role}]: {text}")
    return "\n".join(lines)


def _repair_json(raw: str) -> str:
    """
    Best-effort extraction of a JSON object from a potentially
    markdown-wrapped or partially malformed LLM response.
    """
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw.strip())

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return match.group(0)
    return raw


# Main Extraction function
async def generate_thought_card(
    topic_id: str,
    topic_summary: str,
    history: list[dict],
    language: str = "en-IN",
) -> ThoughtCard:
    """
    Calls Gemini to extract a ThoughtCard from the session history.
    Args:
        topic_id:       e.g. "survivorship-bias"
        topic_summary:  Short description of the topic from topics.json
        history:        List of {"role": "AI"|"USER"|"Host1"|"Host2", "text": "..."} dicts
        language:       Session language code (informational)
    Returns:
        ThoughtCard instance (Pydantic model)
    """
    transcript = _build_transcript(history)

    user_prompt = f"""\
Topic: {topic_summary}
Language: {language}
Turns: {len(history)}
--- CONVERSATION TRANSCRIPT ---
{transcript}
--- END TRANSCRIPT ---
Generate the Atomic Thought Card JSON now.
"""

    gen_config = types.GenerateContentConfig(
        system_instruction=_SCRIBE_SYSTEM,
        temperature=0.2,
        max_output_tokens=1000,
    )

    raw = ""
    for model_name in CANDIDATE_MODELS:
        try:
            response = await _client.aio.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=gen_config,
            )
            candidate = (response.text or "").strip()
            if candidate:
                raw = candidate
                logger.debug("Scribe raw response from %s: %s", model_name, raw)
                break
        except Exception as exc:
            logger.warning("Scribe call to %s failed: %s", model_name, exc)
            if model_name == CANDIDATE_MODELS[-1] and not raw:
                logger.error("All Gemini scribe models failed.")
                return ThoughtCard(
                    core_thesis=f"A debate on: {topic_summary}",
                    user_stance="Unable to synthesize stance from available volleys.",
                    blind_spots="Analysis unavailable due to upstream connectivity.",
                    key_insight="Dialectical friction distills conviction into clarity.",
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
                key_insight="Parse error — could not extract key insight.",
            )

    # Normalize key_insights vs key_insight
    if isinstance(parsed, dict):
        if "key_insights" in parsed and "key_insight" not in parsed:
            parsed["key_insight"] = parsed["key_insights"]

    # Validate with Pydantic
    try:
        card = ThoughtCard(**parsed)
    except Exception as exc:
        logger.error("ThoughtCard validation failed: %s | parsed=%s", exc, parsed)
        card = ThoughtCard(
            core_thesis=parsed.get("core_thesis", f"A debate on: {topic_summary}"),
            user_stance=parsed.get("user_stance", "Unable to determine stance."),
            blind_spots=parsed.get("blind_spots", "Unable to determine blind spots."),
            key_insight=parsed.get("key_insight") or parsed.get("key_insights", "Dialectical friction distills conviction into clarity."),
        )
    return card
