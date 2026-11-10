import { Topic } from "@/types/topic";
import {
  DialecticMode,
  DialecticStage,
  DialogueSegmentPayload,
  EndSparResponse,
  SparLanguage,
  StartSparResponse,
  TurnAudioResponse,
  TurnTextResponse,
} from "@/types/spar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // fallback
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

export const api = {
  /**
   * Health check for backend
   */
  async health(): Promise<{ status: string; service: string }> {
    return request<{ status: string; service: string }>("/health");
  },

  /**
   * Fetch all daily topics
   */
  async getDailyTopics(): Promise<Topic[]> {
    return request<Topic[]>("/topics/daily");
  },

  /**
   * Fetch a single topic by ID
   */
  async getTopic(topicId: string): Promise<Topic> {
    return request<Topic>(`/topics/${encodeURIComponent(topicId)}`);
  },

  /**
   * Start a new sparring session (text/dialogue response)
   */
  async startSpar(
    topicId: string,
    language: SparLanguage = "en-IN",
    mode: DialecticMode = "podcast",
    userName?: string
  ): Promise<StartSparResponse> {
    return request<StartSparResponse>("/spar/start", {
      method: "POST",
      body: JSON.stringify({
        topic_id: topicId,
        language,
        mode,
        user_name: userName,
      }),
    });
  },

  /**
   * Start a new sparring session (audio response for Spar mode)
   */
  async startSparAudio(
    topicId: string,
    language: SparLanguage = "en-IN",
    mode: DialecticMode = "podcast"
  ): Promise<{ sessionId: string; stage: DialecticStage; introText: string; audioBlob: Blob }> {
    const url = `${API_BASE_URL}/spar/start/audio?topic_id=${encodeURIComponent(
      topicId
    )}&language=${encodeURIComponent(language)}&mode=${encodeURIComponent(mode)}`;
    const response = await fetch(url, { method: "POST" });

    if (!response.ok) {
      throw new ApiError(`Audio start failed: ${response.statusText}`, response.status);
    }

    const sessionId = response.headers.get("X-Session-Id") || "";
    const stage = (response.headers.get("X-Stage") || "INTRO") as DialecticStage;
    const rawAi = response.headers.get("X-Ai-Response");
    const introText = rawAi ? decodeURIComponent(rawAi) : "";
    const audioBlob = await response.blob();

    return { sessionId, stage, introText, audioBlob };
  },

  /**
   * Dynamically switch dialectic language for an active session
   */
  async updateSessionLanguage(
    sessionId: string,
    language: SparLanguage
  ): Promise<{ status: string; session_id: string; language: string; voice: string }> {
    return request<{ status: string; session_id: string; language: string; voice: string }>(
      `/spar/session/${encodeURIComponent(sessionId)}/language`,
      {
        method: "POST",
        body: JSON.stringify({ language }),
      }
    );
  },

  /**
   * Fetch background-synthesized audio for a secondary host segment
   */
  async getSegmentAudio(
    sessionId: string,
    turnCount: number,
    segmentIndex: number
  ): Promise<{ audio_base64: string | null; ready: boolean }> {
    return request<{ audio_base64: string | null; ready: boolean }>(
      `/spar/session/${encodeURIComponent(sessionId)}/segment-audio?turn_count=${turnCount}&segment_index=${segmentIndex}`
    );
  },

  /**
   * Submit text turn to the engine (JSON body)
   */
  async sendTurnText(
    sessionId: string,
    userText: string,
    language?: SparLanguage
  ): Promise<TurnTextResponse> {
    return request<TurnTextResponse>("/spar/turn/text", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        user_text: userText,
        language,
      }),
    });
  },

  /**
   * Submit audio blob turn to the engine (dual-mode: handles JSON dialogue for podcast or WAV for spar)
   */
  async sendTurnAudio(
    sessionId: string,
    audioBlob: Blob,
    language?: SparLanguage
  ): Promise<TurnAudioResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "user_turn.wav");

    const langParam = language ? `&language=${encodeURIComponent(language)}` : "";
    const url = `${API_BASE_URL}/spar/turn?session_id=${encodeURIComponent(sessionId)}${langParam}`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = `Turn audio submission failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // use fallback
      }
      throw new ApiError(errorDetail, response.status);
    }

    const contentType = response.headers.get("content-type") || "";

    // 1. Podcast Mode returns JSON with dialogue segments and base64 audio
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return {
        sessionId: data.session_id,
        mode: data.mode || "podcast",
        userTranscript: data.user_transcript || "",
        aiResponse: data.ai_response || "",
        stage: data.stage || "STUDIO",
        isComplete: !!data.is_complete,
        dialogue: data.dialogue || null,
        directed_at_guest: data.directed_at_guest ?? true,
        topic_insight: data.topic_insight || null,
        audioBlob: null,
      };
    }

    // 2. Spar Mode returns binary WAV with telemetry headers
    const rawTranscript = response.headers.get("X-User-Transcript") || "";
    const rawAi = response.headers.get("X-Ai-Response") || "";
    const userTranscript = rawTranscript ? decodeURIComponent(rawTranscript) : "";
    const aiResponse = rawAi ? decodeURIComponent(rawAi) : "";

    const stage = (response.headers.get("X-Stage") || "CHALLENGE") as DialecticStage;
    const isComplete = response.headers.get("X-Is-Complete") === "true";
    const returnedAudioBlob = await response.blob();

    return {
      sessionId,
      mode: "spar",
      userTranscript,
      aiResponse,
      stage,
      isComplete,
      audioBlob: returnedAudioBlob,
      dialogue: null,
    };
  },

  /**
   * Progressive SSE Streaming turn (Phase 4 low-latency pipeline):
   * Emits user transcript immediately (t=~1.5s), then streams dialogue segments
   * with 24kHz synthesized audio for near-instant playback.
   */
  async sendTurnAudioStream(
    sessionId: string,
    audioBlob: Blob,
    callbacks: {
      onTranscript: (text: string) => void;
      onSegment: (segment: DialogueSegmentPayload) => void;
      onMetadata: (meta: {
        stage?: DialecticStage | string;
        directed_at_guest?: boolean;
        topic_insight?: string | null;
        is_complete?: boolean;
      }) => void;
      onError?: (err: unknown) => void;
      onDone?: () => void;
    },
    language?: SparLanguage
  ): Promise<void> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    const langParam = language ? `&language=${encodeURIComponent(language)}` : "";
    const url = `${API_BASE_URL}/spar/turn/stream?session_id=${encodeURIComponent(sessionId)}${langParam}`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok || !response.body) {
      let errorDetail = `Streaming turn failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // fallback
      }
      throw new ApiError(errorDetail, response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          if (!block.trim()) continue;
          let eventType = "";
          let dataStr = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.slice(5).trim();
            }
          }

          if (!eventType || !dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (eventType === "transcript") {
              callbacks.onTranscript(data.text || "");
            } else if (eventType === "segment") {
              callbacks.onSegment(data as DialogueSegmentPayload);
            } else if (eventType === "metadata") {
              callbacks.onMetadata(data);
            } else if (eventType === "done") {
              callbacks.onDone?.();
            }
          } catch (parseErr) {
            console.error("Error parsing SSE block:", parseErr, block);
          }
        }
      }
      callbacks.onDone?.();
    } catch (err) {
      callbacks.onError?.(err);
      throw err;
    }
  },

  /**
   * End session and trigger Ambient Scribe
   */
  async endSpar(sessionId: string): Promise<EndSparResponse> {
    const url = `/spar/end?session_id=${encodeURIComponent(sessionId)}`;
    return request<EndSparResponse>(url, { method: "POST" });
  },

  /**
   * Extract a URL and synthesize a custom debate topic (Phase 5.4 + 5.5)
   */
  async synthesizeSpark(url: string): Promise<{
    topic: {
      id: string;
      title: string;
      category: string;
      summary: string;
      opening_trap: string;
      source_url: string;
    };
  }> {
    return request("/spark/synthesize", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },
};
