from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import topics, spar

app = FastAPI(
    title="elenchus.ai",
    description="The Socratic Conversational Sparring Engine API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topics.router)
app.include_router(spar.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "elenchus.ai de-rot"}