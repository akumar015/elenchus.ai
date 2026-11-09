"""
Custom Spark routes:
  POST /spark/synthesize  — extract URL or premise + synthesize a debate topic
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.url_extractor import (
    extract_and_synthesize,
    synthesize_premise,
    CustomTopic,
)
from backend.routers.spar import register_custom_topic
from backend.services.dossier_loader import load_topic_dossier

router = APIRouter(prefix="/spark", tags=["spark"])


class SynthesizeRequest(BaseModel):
    url: str | None = None
    query: str | None = None


class SynthesizeResponse(BaseModel):
    topic: CustomTopic


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_spark(req: SynthesizeRequest) -> SynthesizeResponse:
    """
    Given a URL or freeform premise, synthesize an intellectual debate topic.
    Registers the topic and its synthesized dossier in memory ready for /spar/start.
    """
    input_str = (req.url or req.query or "").strip()
    if not input_str:
        raise HTTPException(
            status_code=422,
            detail="Must provide either 'url' or 'query' to synthesize a spark.",
        )

    try:
        if input_str.startswith(("http://", "https://")):
            topic = await extract_and_synthesize(input_str)
        else:
            topic = await synthesize_premise(input_str)

        # Register in-memory with pre-loaded dossier
        topic_dict = topic.model_dump()
        topic_dict["dossier"] = load_topic_dossier(topic.id, topic.summary)
        register_custom_topic(topic_dict)

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return SynthesizeResponse(topic=topic)
