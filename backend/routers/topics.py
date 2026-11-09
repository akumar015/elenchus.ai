"""
Topics router:
  GET /topics/daily — returns all curated drop topics with dossiers hydrated
  GET /topics/{id}  — returns single topic (static, custom spark, or fallback)
"""

import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.dossier_loader import load_topic_dossier

router = APIRouter(prefix="/topics", tags=["topics"])

_TOPICS_PATH = Path(__file__).parent.parent / "data" / "topics.json"


class Topic(BaseModel):
    id: str
    title: str
    category: str
    summary: str
    opening_trap: str
    dossier: str = ""


@router.get("/daily", response_model=list[Topic])
async def get_daily_topics() -> list[Topic]:
    """Return all available daily drop topics with in-context dossiers."""
    with open(_TOPICS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    topics = []
    for t in data:
        topic_dict = dict(t)
        topic_dict["dossier"] = load_topic_dossier(t["id"], t.get("summary", ""))
        topics.append(Topic(**topic_dict))
    return topics


@router.get("/{topic_id}", response_model=Topic)
async def get_topic(topic_id: str) -> Topic:
    """
    Return a single topic by ID with full dossier context.
    Checks custom spark registry, static daily drops, or generates a dynamic fallback.
    """
    from backend.routers.spar import _custom_topics

    # 1. Check custom topics registered dynamically
    if topic_id in _custom_topics:
        t = dict(_custom_topics[topic_id])
        if "dossier" not in t or not t["dossier"]:
            t["dossier"] = load_topic_dossier(topic_id, t.get("summary", ""))
        return Topic(**t)

    # 2. Check static daily drops in topics.json
    with open(_TOPICS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for t in data:
        if t["id"] == topic_id:
            topic_dict = dict(t)
            topic_dict["dossier"] = load_topic_dossier(t["id"], t.get("summary", ""))
            return Topic(**topic_dict)

    # 3. Dynamic fallback for freeform premises / unknown slugs
    clean_title = topic_id.replace("custom-", "").replace("-", " ").title()
    dossier = load_topic_dossier(topic_id, clean_title)
    fallback = Topic(
        id=topic_id,
        title=clean_title,
        category="User Inscribed Premise",
        summary=clean_title,
        opening_trap=f"State your conviction clearly so the hosts can test where {clean_title} fractures.",
        dossier=dossier,
    )
    _custom_topics[topic_id] = fallback.model_dump()
    return fallback
