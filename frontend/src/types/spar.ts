export type DialecticStage = "INTRO" | "CHALLENGE" | "PUSHBACK" | "DEEPEN" | "WRAP";

export type SparLanguage = "en-IN" | "hi-IN";

export type MicStatus = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface Turn {
  role: "AI" | "USER";
  text: string;
  stage?: DialecticStage;
  timestamp: number;
}

export interface StartSparResponse {
  session_id: string;
  intro_text: string;
}

export interface TurnTextResponse {
  session_id: string;
  user_transcript: string;
  ai_response: string;
  stage: DialecticStage;
  is_complete: boolean;
}

export interface TurnAudioResponse {
  sessionId: string;
  userTranscript: string;
  aiResponse: string;
  stage: DialecticStage;
  isComplete: boolean;
  audioBlob: Blob;
}

export interface ThoughtCard {
  core_thesis: string;
  user_stance: string;
  blind_spots: string;
  key_insight: string;
}

export interface EndSparResponse {
  session_id: string;
  topic_id: string;
  language: SparLanguage;
  total_turns: number;
  final_stage: DialecticStage;
  history: Array<{
    role: "AI" | "USER";
    text: string;
  }>;
  thought_card?: ThoughtCard;  // present after Phase 4.2 backend
}
