export type DialecticStage = "INTRO" | "CHALLENGE" | "PUSHBACK" | "DEEPEN" | "WRAP" | "STUDIO";

export type DialecticMode = "podcast" | "spar";

export type SparLanguage = "en-IN" | "hi-IN" | "pa-IN" | "te-IN";

export type MicStatus = "idle" | "listening" | "thinking" | "speaking" | "error";

export type SpeakerRole = "AI" | "USER" | "HOST1" | "HOST2";

export type ActiveSpeaker = "idle" | "host1" | "host2" | "user";

export interface Turn {
  role: SpeakerRole;
  speakerName?: string; // "Kalpana" | "Shivani" | "Avinash" | "You"
  speakerVoice?: string;
  text: string;
  stage?: DialecticStage | string;
  timestamp: number;
  topic_insight?: string | null;
  audio_base64?: string | null;
}

export interface DialogueSegmentPayload {
  speaker: string; // "Host1" | "Host2" | "AI"
  voice: string;   // "Kalpana" | "Shivani" | "Avinash"
  text: string;
  audio_base64?: string | null;
  turn_count?: number;
  segment_index?: number;
}

export interface StartSparResponse {
  session_id: string;
  intro_text: string;
  mode?: DialecticMode;
  dialogue?: DialogueSegmentPayload[];
}

export interface TurnTextResponse {
  session_id: string;
  mode?: DialecticMode;
  user_transcript: string;
  ai_response: string;
  stage: DialecticStage | string;
  is_complete: boolean;
  dialogue?: DialogueSegmentPayload[];
  directed_at_guest?: boolean;
  topic_insight?: string | null;
}

export interface TurnAudioResponse {
  sessionId: string;
  mode?: DialecticMode;
  userTranscript: string;
  aiResponse: string;
  stage: DialecticStage | string;
  isComplete: boolean;
  audioBlob?: Blob | null;
  dialogue?: DialogueSegmentPayload[] | null;
  directed_at_guest?: boolean;
  topic_insight?: string | null;
}

export interface ThoughtCard {
  core_thesis: string;
  user_stance: string;
  blind_spots: string;
  key_insight: string;
}

export interface SavedThoughtCard {
  id: string;
  topicId: string;
  topicTitle: string;
  category?: string;
  mode: DialecticMode;
  language: SparLanguage;
  date: string; // ISO string
  totalTurns: number;
  finalStage?: DialecticStage | string;
  card: ThoughtCard;
}

export interface EndSparResponse {
  session_id: string;
  topic_id: string;
  language: SparLanguage;
  total_turns: number;
  final_stage: DialecticStage;
  history: Array<{
    role: "AI" | "USER" | "HOST1" | "HOST2" | "Host1" | "Host2";
    text: string;
  }>;
  thought_card?: ThoughtCard;
}
