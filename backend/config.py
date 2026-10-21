from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Google / Gemini
    google_api_key: str

    # OpenRouter (fallback LLM)
    openrouter_api_key: str

    # Gnani / Vachana Platform
    gnani_api_key: str
    gnani_api_base_url: str = "https://api.vachana.ai"

    # STT endpoints
    gnani_prisma_stt_endpoint: str           # REST push-to-talk:      POST /stt/v3
    gnani_prisma_stt_ws_endpoint: str = ""   # Realtime streaming:     wss://.../stream  (Phase 3)

    # TTS endpoints
    gnani_timbre_tts_endpoint: str           # REST inference:         POST /api/v1/tts/inference
    gnani_timbre_tts_sse_endpoint: str = ""  # SSE streaming:          POST /api/v1/tts/sse  (Phase 3)
    gnani_timbre_tts_ws_endpoint: str = ""   # WebSocket realtime:     wss://.../tts  (Phase 3)

    # LLM (Evon — unused while Gemini is primary)
    gnani_evon_llm_endpoint: str = ""


settings = Settings()
