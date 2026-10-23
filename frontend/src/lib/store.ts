import { create } from "zustand";
import { Topic } from "@/types/topic";
import { DialecticStage, MicStatus, SparLanguage, Turn } from "@/types/spar";

interface SparState {
  // Session & Topic State
  currentTopic: Topic | null;
  sessionId: string | null;
  language: SparLanguage;
  stage: DialecticStage;
  isComplete: boolean;

  // Dialogue & Turns
  turns: Turn[];

  // Real-time Voice & Audio Telemetry
  micStatus: MicStatus;
  audioLevel: number; // 0.0 - 1.0 (RMS normalized)
  activeAudioUrl: string | null; // Currently playing AI audio

  // System & Error handling
  errorMessage: string | null;

  // Actions
  setCurrentTopic: (topic: Topic | null) => void;
  setLanguage: (lang: SparLanguage) => void;
  setSession: (sessionId: string, introText?: string) => void;
  addTurn: (role: "AI" | "USER", text: string, stage?: DialecticStage) => void;
  setMicStatus: (status: MicStatus) => void;
  setAudioLevel: (level: number) => void;
  setStage: (stage: DialecticStage) => void;
  setComplete: (isComplete: boolean) => void;
  setActiveAudioUrl: (url: string | null) => void;
  setError: (err: string | null) => void;
  resetSession: () => void;
}

export const useSparStore = create<SparState>((set) => ({
  currentTopic: null,
  sessionId: null,
  language: "en-IN",
  stage: "INTRO",
  isComplete: false,
  turns: [],
  micStatus: "idle",
  audioLevel: 0,
  activeAudioUrl: null,
  errorMessage: null,

  setCurrentTopic: (topic) => set({ currentTopic: topic }),

  setLanguage: (language) => set({ language }),

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

  addTurn: (role, text, stage) =>
    set((state) => ({
      turns: [
        ...state.turns,
        {
          role,
          text,
          stage: stage || state.stage,
          timestamp: Date.now(),
        },
      ],
      ...(stage ? { stage } : {}),
    })),

  setMicStatus: (micStatus) => set({ micStatus }),

  setAudioLevel: (audioLevel) => set({ audioLevel }),

  setStage: (stage) => set({ stage }),

  setComplete: (isComplete) => set({ isComplete }),

  setActiveAudioUrl: (activeAudioUrl) => set({ activeAudioUrl }),

  setError: (errorMessage) => set({ errorMessage }),

  resetSession: () =>
    set({
      sessionId: null,
      currentTopic: null,
      stage: "INTRO",
      isComplete: false,
      turns: [],
      micStatus: "idle",
      audioLevel: 0,
      activeAudioUrl: null,
      errorMessage: null,
    }),
}));
