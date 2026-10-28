"""
Custom Spark routes:
  POST /spark/synthesize  — extract URL + synthesize a debate topic
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.url_extractor import extract_and_synthesize, CustomTopic
from backend.routers.spar import register_custom_topic

router = APIRouter(prefix="/spark", tags=["spark"])


class SynthesizeRequest(BaseModel):
    url: str 


class SynthesizeResponse(BaseModel):
    topic: CustomTopic


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_spark(req: SynthesizeRequest) -> SynthesizeResponse:
    """
    Given a URL, extract article text and synthesize a custom debate topic.
    Registers the topic in memory and returns a CustomTopic ready for /spar/start.
    """
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="URL must start with http:// or https://")

    try:
        topic = await extract_and_synthesize(url)
        # Register in-memory so /spar/start and /spar/start/audio can find it
        register_custom_topic(topic.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) 
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return SynthesizeResponse(topic=topic)
