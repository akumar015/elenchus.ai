"""
URL Extractor & Dynamic Topic Synthesizer
Extracts clean article text from any URL using trafilatura, then prompts
Gemini to synthesize a debate-ready topic with an opening trap.
"""

import json
import re
import logging
import asyncio
import trafilatura
from google import genai
from google.genai import types
from pydantic import BaseModel, HttpUrl
from backend.config import settings

logger= logging.getLogger(__name__)

MODEL = "gemini-3.1-flash-lite"
_client= genai.Client(api_key= settings.google_api_key)


# Output Schema
class CustomTopic(BaseModel):
    id: str             # slugified from title
    title: str          # Short punchy title for the topic
    category: str       # e.g "custom spark"
    summary: str        # 2-3 sentence objective summary
    opening_trap:str    # Controversial opening question/trap 
    source_url: str     # Original URL


# step-1: Extract article text
def _extract_text(url: str)-> str:
    """
    Download and extract clean article text from a URL using trafilatura.
    Returns raw text, or raises ValueError if extraction fails.
    """

    downloaded= trafilatura.fetch_url(url)
    if not downloaded:
        raise ValueError(f"could not fetch url: {url}")

    text= trafilatura.extract(
        downloaded,
        include_comments= False,
        include_tables= False,
        no_fallback= False,
        favor_precision= True,
    )

    if not text or len(text.strip())< 100:
        raise ValueError("Extracted text is too short or empty, the page maybe paywalled or Javascript rendered")

    # Truncate to ~6000 chars to stay well within token budget
    return text.strip()[:6000]



# Step-2: Synthesize topic via gemini
_SYNTHESIZER_SYSTEM = """\
You are the Spark Synthesizer for elenchus.ai, a Socratic debate engine.
Given an article or essay extract, generate a structured debate topic JSON.
OUTPUT: Valid JSON only. No markdown fences. No commentary. No extra keys.
Schema:
{
  "title": "<5-8 word punchy debate title, not a summary, a provocation>",
  "summary": "<2-3 sentences: objective explanation of the article's core thesis, what does the author actually claim?>",
  "opening_trap": "<One hard, uncomfortable question that forces the debater to defend the article's core claim immediately. Should be adversarial, not informational. 1-2 sentences max.>"
}
Rules:
- title must be a debate prompt, not a newspaper headline. Bad: "How AI is changing work." Good: "AI Eliminates Creativity or Concentrates It In Fewer Hands."
- summary must be neutral and faithful to the source, not your opinion.
- opening_trap must be impossible to answer with "yes" or "no". It must expose a hidden assumption in the article's argument.
- Never return empty strings.
"""

async def _synthesize_topic(text: str, url: str)-> CustomTopic:
    """
    Call Gemini to extract a debate topic form extracted article text
    """

    user_prompt= f"""\
SOURCE URL: {url}

ARTICLE TEXT (truncated to ~6000 chars): {text}

Generate the debate topic in JSON now
"""

    try:
        response = await _client.aio.models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=_SYNTHESIZER_SYSTEM,
                temperature= 0.4,
                max_output_tokens= 400
            )
        )

        raw= (response.text or "").strip()

    except Exception as exc:
        raise RuntimeError(f"Gemini synthesis failed: {exc}") from exc

    # Parse JSON: strip markdown fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"\s*```$", "", raw).strip()

    try: 
        parsed= json.loads(raw)
    except json.JSONDecodeError:
        match= re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            parsed= json.loads(match.group(0))

        else:
            raise ValueError(f"Could not parse Gemini JSON request: {raw[:200]}")

    # slugify title
    slug= re.sub(r"[^a-z0-9]+", "-", parsed["title"].lower()).strip("-")[:60]

    return CustomTopic(
        id=f"custom-{slug}",
        title=parsed["title"],
        category="Custom Spark",
        summary=parsed["summary"],
        opening_trap=parsed["opening_trap"],
        source_url=url,
    )



# Public API

async def extract_and_synthesize(url: str) -> CustomTopic:
    """
    Full pipeline: fetch URL → extract text → synthesize debate topic.
    Runs extraction in a thread (trafilatura is sync + network-bound).
    Raises:
        ValueError: if URL can't be fetched or text is too short
        RuntimeError: if Gemini synthesis fails
    """
    # trafilatura.fetch_url is synchronous + blocking — run in thread
    text = await asyncio.to_thread(_extract_text, url)
    topic = await _synthesize_topic(text, url)
    return topic