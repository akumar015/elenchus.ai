"""
GET /topics/daily — returns today's topic cards.
"""

import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/topics", tags=["topics"])

_TOPICS_PATH = Path(__file__).parent.parent / "data" / "topics.json"


class Topic(BaseModel):
    id: str
    title: str
    category: str
    summary: str
    opening_trap: str


@router.get("/daily", response_model=list[Topic])
async def get_daily_topics() -> list[Topic]:
    """Return all available daily drop topics."""
    with open(_TOPICS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return [Topic(**t) for t in data]


@router.get("/{topic_id}", response_model=Topic)
async def get_topic(topic_id: str) -> Topic:
    """Return a single topic by its ID."""
    with open(_TOPICS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for t in data:
        if t["id"] == topic_id:
            return Topic(**t)
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")