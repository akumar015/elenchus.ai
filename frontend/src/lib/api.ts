import { Topic } from "@/types/topic";
import {
  DialecticStage,
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
   * Start a new sparring session (text response)
   */
  async startSpar(
    topicId: string,
    language: SparLanguage = "en-IN"
  ): Promise<StartSparResponse> {
    return request<StartSparResponse>("/spar/start", {
      method: "POST",
      body: JSON.stringify({ topic_id: topicId, language }),
    });
  },

  /**
   * Start a new sparring session (audio response)
   */
  async startSparAudio(
    topicId: string,
    language: SparLanguage = "en-IN"
  ): Promise<{ sessionId: string; stage: DialecticStage; introText: string; audioBlob: Blob }> {
    const url = `${API_BASE_URL}/spar/start/audio?topic_id=${encodeURIComponent(
      topicId
    )}&language=${encodeURIComponent(language)}`;
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
   * Submit audio blob turn to the engine
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

    const rawTranscript = response.headers.get("X-User-Transcript") || "";
    const rawAi = response.headers.get("X-Ai-Response") || "";
    const userTranscript = rawTranscript ? decodeURIComponent(rawTranscript) : "";
    const aiResponse = rawAi ? decodeURIComponent(rawAi) : "";

    const stage = (response.headers.get("X-Stage") || "CHALLENGE") as DialecticStage;
    const isComplete = response.headers.get("X-Is-Complete") === "true";
    const returnedAudioBlob = await response.blob();

    return {
      sessionId,
      userTranscript,
      aiResponse,
      stage,
      isComplete,
      audioBlob: returnedAudioBlob,
    };
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
