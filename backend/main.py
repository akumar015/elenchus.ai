import sys

# Ensure UTF-8 output on Windows consoles so Hindi/Devanagari text never crashes with UnicodeEncodeError
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="backslashreplace")

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import topics, spar, spark
from backend.services.gnani_stt import _get_client as get_stt_client
from backend.services.gnani_tts import _get_client as get_tts_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warmup Gnani clients on server startup
    try:
        get_stt_client()
        get_tts_client()
    except Exception as exc:
        print(f"Warning: Gnani SDK pre-warming failed")
    yield

app = FastAPI(
    title="elenchus.ai",
    description="The Socratic Conversational Sparring Engine API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Session-Id",
        "X-User-Transcript",
        "X-Ai-Response",
        "X-Stage",
        "X-Is-Complete",
        "X-Language",
    ],
)

app.include_router(topics.router)
app.include_router(spar.router)
app.include_router(spark.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "elenchus.ai de-rot"}
