import { create } from "zustand";
import { Topic } from "@/types/topic";
import {
  ActiveSpeaker,
  DialecticMode,
  DialecticStage,
  MicStatus,
  SocraticRigor,
  SparLanguage,
  SpeakerRole,
  Turn,
} from "@/types/spar";

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
  sub?: string;
  idToken?: string;
}

interface SparState {
  // User Authentication
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;

  // Session & Topic State
  currentTopic: Topic | null;
  sessionId: string | null;
  mode: DialecticMode;
  language: SparLanguage;
  rigor: SocraticRigor;
  stage: DialecticStage | string;
  isComplete: boolean;

  // Dialogue & Turns
  turns: Turn[];

  // Real-time Voice & Audio Telemetry
  micStatus: MicStatus;
  activeSpeaker: ActiveSpeaker;
  audioLevel: number; // 0.0 - 1.0 (RMS normalized)
  activeAudioUrl: string | null; // Currently playing AI audio

  // System & Error handling
  errorMessage: string | null;

  // Actions
  setCurrentTopic: (topic: Topic | null) => void;
  setMode: (mode: DialecticMode) => void;
  setLanguage: (lang: SparLanguage) => void;
  setRigor: (rigor: SocraticRigor) => void;
  setSession: (sessionId: string, introText?: string) => void;
  addTurn: (
    role: SpeakerRole,
    text: string,
    stage?: DialecticStage | string,
    meta?: {
      speakerName?: string;
      speakerVoice?: string;
      topic_insight?: string | null;
      audio_base64?: string | null;
    }
  ) => void;
  setMicStatus: (status: MicStatus) => void;
  setActiveSpeaker: (speaker: ActiveSpeaker) => void;
  setAudioLevel: (level: number) => void;
  setStage: (stage: DialecticStage | string) => void;
  setComplete: (isComplete: boolean) => void;
  setActiveAudioUrl: (url: string | null) => void;
  setError: (err: string | null) => void;
  setLastTopicInsight: (insight: string | null) => void;
  resetSession: () => void;
}

export const useSparStore = create<SparState>((set) => ({
  user:
    typeof window !== "undefined"
      ? (() => {
          try {
            const stored = localStorage.getItem("elenchus_auth_user");
            return stored ? JSON.parse(stored) : null;
          } catch {
            return null;
          }
        })()
      : null,
  currentTopic: null,
  sessionId: null,
  mode: "podcast",
  language: "en-IN",
  rigor:
    typeof window !== "undefined"
      ? (() => {
          const stored = localStorage.getItem("elenchus_dialectic_rigor");
          if (stored === "hardcore") return "expert";
          return (stored as SocraticRigor) || "balanced";
        })()
      : "balanced",
  stage: "INTRO",
  isComplete: false,
  turns: [],
  micStatus: "idle",
  activeSpeaker: "idle",
  audioLevel: 0,
  activeAudioUrl: null,
  errorMessage: null,

  setUser: (user) => {
    if (typeof window !== "undefined") {
      try {
        if (user) {
          localStorage.setItem("elenchus_auth_user", JSON.stringify(user));
        } else {
          localStorage.removeItem("elenchus_auth_user");
        }
      } catch {
        // storage unavailable in private browsing
      }
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("elenchus_auth_user");
      } catch {
        // ignore
      }
    }
    set({ user: null });
  },

  setCurrentTopic: (topic) => set({ currentTopic: topic }),

  setMode: (mode) => set({ mode }),

  setLanguage: (language) => set({ language }),

  setRigor: (rigor) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("elenchus_dialectic_rigor", rigor);
      } catch {
        // ignore
      }
    }
    set({ rigor });
  },

  setSession: (sessionId, introText) =>
    set({
      sessionId,
      stage: "INTRO",
      isComplete: false,
      errorMessage: null,
      turns: introText
        ? [
            {
              role: "AI",
              text: introText,
              stage: "INTRO",
              timestamp: Date.now(),
            },
          ]
        : [],
    }),

  addTurn: (role, text, stage, meta) =>
    set((state) => ({
      turns: [
        ...state.turns,
        {
          role,
          text,
          stage: stage || state.stage,
          timestamp: Date.now(),
          speakerName: meta?.speakerName,
          speakerVoice: meta?.speakerVoice,
          topic_insight: meta?.topic_insight,
          audio_base64: meta?.audio_base64,
        },
      ],
      ...(stage ? { stage } : {}),
    })),

  setMicStatus: (micStatus) => set({ micStatus }),

  setActiveSpeaker: (activeSpeaker) => set({ activeSpeaker }),

  setAudioLevel: (audioLevel) => set({ audioLevel }),

  setStage: (stage) => set({ stage }),

  setComplete: (isComplete) => set({ isComplete }),

  setActiveAudioUrl: (activeAudioUrl) => set({ activeAudioUrl }),

  setError: (errorMessage) => set({ errorMessage }),

  setLastTopicInsight: (insight) =>
    set((state) => {
      if (state.turns.length === 0 || !insight) return state;
      const turns = [...state.turns];
      for (let i = turns.length - 1; i >= 0; i--) {
        if (turns[i].role === "HOST1" || turns[i].role === "AI") {
          turns[i] = { ...turns[i], topic_insight: insight };
          break;
        }
      }
      return { turns };
    }),

  resetSession: () =>
    set({
      sessionId: null,
      currentTopic: null,
      stage: "INTRO",
      isComplete: false,
      turns: [],
      micStatus: "idle",
      activeSpeaker: "idle",
      audioLevel: 0,
      activeAudioUrl: null,
      errorMessage: null,
    }),
}));
