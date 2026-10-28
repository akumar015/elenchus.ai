"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSparStore } from "@/lib/store";
import { api } from "@/lib/api";
import { AudioRecorder } from "@/lib/audioRecorder";
import { STARTER_TOPICS } from "@/lib/starterTopics";
import { Topic } from "@/types/topic";
import { DialecticStage, EndSparResponse, SparLanguage } from "@/types/spar";
import { VoiceOrb } from "@/components/spar/VoiceOrb";
import { StageProgress } from "@/components/spar/StageProgress";
import { TranscriptFeed } from "@/components/spar/TranscriptFeed";
import { AtomicThoughtCard } from "@/components/spar/AtomicThoughtCard";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import {
  ArrowLeft,
  Send,
  Flag,
  Volume2,
  VolumeX,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

export default function SparringArenaPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = (params?.topic as string) || "";

  const {
    language,
    sessionId,
    stage,
    turns,
    micStatus,
    audioLevel,
    isComplete,
    errorMessage,
    setLanguage,
    setSession,
    addTurn,
    setMicStatus,
    setAudioLevel,
    setStage,
    setComplete,
    setError,
    resetSession,
  } = useSparStore();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [textInput, setTextInput] = useState<string>("");
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [sessionEndedSummary, setSessionEndedSummary] = useState<EndSparResponse | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Play audio helper
  const playAudioBlob = useCallback(
    (blob: Blob) => {
      if (audioMuted) return;

      const url = URL.createObjectURL(blob);
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }

      const player = audioPlayerRef.current;
      player.src = url;

      setMicStatus("speaking");

      player.onended = () => {
        setMicStatus("idle");
        URL.revokeObjectURL(url);
      };

      player.onerror = () => {
        setMicStatus("idle");
        URL.revokeObjectURL(url);
      };

      player.play().catch((err: unknown) => {
        console.warn("Autoplay was prevented by browser:", err);
        setAutoplayBlocked(true);
        setMicStatus("idle");
      });
    },
    [audioMuted, setMicStatus]
  );

  // Dynamic language switcher (Phase 5.3)
  const handleLanguageSwitch = useCallback(
    async (newLang: SparLanguage) => {
      if (newLang === language) return;
      setLanguage(newLang);
      if (sessionId) {
        try {
          await api.updateSessionLanguage(sessionId, newLang);
        } catch (err: unknown) {
          console.warn("Failed to sync session language to backend:", err);
        }
      }
    },
    [language, sessionId, setLanguage]
  );

  // Browser Autoplay Resume Handler (Phase 6.2)
  const handleResumeAutoplay = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current
        .play()
        .then(() => {
          setAutoplayBlocked(false);
          setMicStatus("speaking");
        })
        .catch(() => setAutoplayBlocked(false));
    }
  }, [setMicStatus]);

  // 1. Initialize Topic & Session on Mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    resetSession();

    // Find topic from starters or fetch from API
    const localTopic = STARTER_TOPICS.find((t) => t.id === topicId);
    const storedCustom = sessionStorage.getItem(`custom-topic-${topicId}`);
    if (!localTopic && storedCustom) {
    try {
        setTopic(JSON.parse(storedCustom));
    } catch {
    // ignore parse errors
    }
}
    if (localTopic) {
      setTopic(localTopic);
    }

    api
      .getTopic(topicId)
      .then((t) => {
        setTopic(t);
      })
      .catch(() => {
        // fallback already set from STARTER_TOPICS
      });

    // Start audio sparring session
    api
      .startSparAudio(topicId, language)
      .then(({ sessionId: sid, stage: initialStage, introText, audioBlob }) => {
        const trapText = introText || localTopic?.opening_trap || "Let us examine your premise.";
        setSession(sid, trapText);
        setStage(initialStage);
        setLoading(false);
        // Play AI intro audio
        playAudioBlob(audioBlob);
      })
      .catch((err) => {
        console.warn("Audio start fallback to text mode:", err);
        // Fallback to text start if audio fails or rate limited
        api
          .startSpar(topicId, language)
          .then((res) => {
            setSession(res.session_id, res.intro_text);
            setLoading(false);
          })
          .catch((startErr: unknown) => {
            const msg = startErr instanceof Error ? startErr.message : "Could not connect to Socratic Engine";
            setError(msg);
            setLoading(false);
          });
      });

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [topicId, language, resetSession, setSession, setStage, setError, playAudioBlob]);

  // 2. Voice Push-to-Talk Handlers
  const handleStartSpeaking = useCallback(async () => {
    if (micStatus === "thinking" || micStatus === "speaking") return;
    if (!sessionId) {
      setError("Waiting for dialectic session to initialize...");
      return;
    }

    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      recorderRef.current = new AudioRecorder({
        onVolumeChange: (rms) => setAudioLevel(rms),
      });

      await recorderRef.current.start();
      setMicStatus("listening");
      setError(null);
    } catch (err: unknown) {
      console.error("Mic access failed:", err);
      setError("Microphone unavailable or blocked. Switching to text rebuttal below.");
      setMicStatus("idle");
      setTimeout(() => textInputRef.current?.focus(),100);
    }
  }, [micStatus, sessionId, setAudioLevel, setError, setMicStatus]);

  const handleStopSpeaking = useCallback(async () => {
    if (micStatus !== "listening" || !recorderRef.current) return;

    try {
      setMicStatus("thinking");
      const audioBlob = await recorderRef.current.stop();
      recorderRef.current = null;

      if (!sessionId) {
        throw new Error("No active session ID. Please refresh to re-initialize.");
      }

      // Submit voice turn to FastAPI backend with active language
      const response = await api.sendTurnAudio(sessionId, audioBlob, language);

      // Add turns to transcript feed
      addTurn("USER", response.userTranscript, response.stage);
      addTurn("AI", response.aiResponse, response.stage);
      setStage(response.stage);

      if (response.isComplete) {
        setComplete(true);
      }

      // Play AI voice response
      playAudioBlob(response.audioBlob);
    } catch (err: unknown) {
      console.error("Voice turn error:", err);
      const msg = err instanceof Error ? err.message : "Failed to process voice turn. Try again.";
      setError(msg);
      setMicStatus("idle");
    }
  }, [micStatus, sessionId, language, addTurn, setStage, setComplete, playAudioBlob, setError, setMicStatus]);

  // 3. Text Turn Handler (Fallback / Accessibility)
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || micStatus === "thinking") return;

    if (!sessionId) {
      setError("Waiting for dialectic session to initialize. Please wait a second.");
      return;
    }

    const userText = textInput.trim();
    setTextInput("");
    setMicStatus("thinking");
    setError(null);

    // Add user turn immediately
    addTurn("USER", userText, stage);

    try {
      const response = await api.sendTurnText(sessionId, userText, language);
      addTurn("AI", response.ai_response, response.stage);
      setStage(response.stage as DialecticStage);

      if (response.is_complete) {
        setComplete(true);
      }

      setMicStatus("idle");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Turn failed. Please try again.";
      setError(msg);
      setMicStatus("idle");
    }
  };

  // 4. End Session Handler
  const handleEndSession = async () => {
    if (!sessionId) {
      router.push("/");
      return;
    }
    try {
      const summary = await api.endSpar(sessionId);
      setSessionEndedSummary(summary);
    } catch (err: unknown) {
      console.error("End session failed:", err);
      router.push("/");
    }
  };

  // 5. Global Keyboard Spacebar Listener (Push-to-Talk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        handleStartSpeaking();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        handleStopSpeaking();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleStartSpeaking, handleStopSpeaking]);

  return (
    <div className="min-h-screen flex flex-col bg-elenchus-ground text-elenchus-chalk">
      {/* Top Sparring Arena Navigation Bar */}
      <nav className="border-b border-elenchus-border bg-elenchus-surface-1/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-elenchus-stone hover:text-elenchus-chalk transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Arena</span>
        </Link>

        {/* Center Topic Title & Session State */}
        <div className="flex items-center gap-3 truncate">
          <span className="font-serif font-bold text-base sm:text-lg text-elenchus-chalk tracking-tight truncate max-w-xs sm:max-w-md">
            {topic?.title || "Socratic Duel"}
          </span>
          {sessionId ? (
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border border-elenchus-emerald/30 bg-elenchus-emerald/10 text-emerald-400 shrink-0">
              ACTIVE DUEL
            </span>
          ) : (
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border border-elenchus-amber/30 bg-elenchus-amber/10 text-elenchus-amber animate-pulse shrink-0">
              INITIALIZING...
            </span>
          )}
        </div>

        {/* Right Session Actions & Language Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <LanguageToggle size="sm" onLanguageChange={handleLanguageSwitch} />

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-1.5 rounded-md border border-elenchus-border bg-elenchus-surface-2 text-elenchus-stone hover:text-elenchus-chalk"
            title={audioMuted ? "Unmute AI voice" : "Mute AI voice"}
          >
            {audioMuted ? (
              <VolumeX className="w-4 h-4 text-elenchus-crimson" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleEndSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-elenchus-crimson/30 bg-elenchus-crimson/10 font-mono text-xs uppercase tracking-wider text-elenchus-crimson hover:bg-elenchus-crimson hover:text-white transition-all"
          >
            <Flag className="w-3 h-3" />
            <span className="hidden sm:inline">Conclude</span>
          </button>
        </div>
      </nav>

      {/* Browser Autoplay Interceptor Banner (Phase 6.2) */}
      {autoplayBlocked && (
        <div className="bg-elenchus-surface-2 border-b border-elenchus-terracotta/40 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-elenchus-chalk">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-elenchus-terracotta animate-pulse" />
            <span>Browser paused AI voice output. Tap to hear adversary.</span>
          </div>
          <button
            onClick={handleResumeAutoplay}
            className="px-3 py-1 rounded bg-elenchus-terracotta text-white font-semibold hover:bg-elenchus-terracotta-hover transition-colors"
          >
            Play Voice
          </button>
        </div>
      )}

      {/* Optional Error Alert Banner */}
      {errorMessage && (
        <div className="bg-elenchus-crimson/10 border-b border-elenchus-crimson/30 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-elenchus-crimson">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Dialectic Split View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Stage Progress & Transcript Feed (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[65vh] lg:h-[calc(100vh-140px)] rounded-xl border border-elenchus-border bg-elenchus-surface-1/40 p-4 sm:p-6 space-y-6">
          <StageProgress currentStage={stage} turnCount={turns.length} />
          <div className="flex-1 overflow-hidden">
            <TranscriptFeed
              turns={turns}
              isThinking={micStatus === "thinking"}
            />
          </div>
        </section>

        {/* Right Column: Voice Orb Sparring Deck (5 cols) */}
        <section className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-elenchus-border bg-elenchus-surface-1/60 p-6 sm:p-8 space-y-6">
          {/* Top Dialectic Status Indicator with Code-Switching Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-elenchus-border pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-elenchus-muted">
                  Voice Core & Engine
                </span>
                <p className="font-mono text-xs font-semibold text-elenchus-terracotta">
                  {language === "hi-IN" ? "HINGLISH · POORVI" : "INDIAN ENGLISH · KAVERI"}
                </p>
              </div>
              <LanguageToggle size="sm" onLanguageChange={handleLanguageSwitch} />
            </div>
            <p className="text-xs text-elenchus-stone leading-relaxed">
              Hold the core to speak, or hold <kbd className="px-1.5 py-0.5 rounded bg-elenchus-surface-3 font-mono text-[10px] text-elenchus-chalk">SPACE</kbd>. Release when you have stated your premise.
            </p>
          </div>

          {/* Central Voice Orb */}
          <div className="py-6 flex items-center justify-center">
            <VoiceOrb
              status={micStatus}
              audioLevel={audioLevel}
              onPressStart={handleStartSpeaking}
              onPressEnd={handleStopSpeaking}
              disabled={loading || isComplete || !sessionId}
            />
          </div>

          {/* Text Fallback Rebuttal Input */}
          <form
            onSubmit={handleTextSubmit}
            className="flex items-center gap-2 pt-4 border-t border-elenchus-border"
          >
            <input
              ref={textInputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                sessionId
                  ? language === "hi-IN"
                    ? "Apna counter-argument yahan type karo..."
                    : "Or type your counter-argument here..."
                  : "Connecting to Socratic Arena..."
              }
              disabled={loading || micStatus === "thinking" || !sessionId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-elenchus-ground border border-elenchus-border text-elenchus-chalk placeholder:text-elenchus-muted font-sans text-xs focus:border-elenchus-terracotta transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || micStatus === "thinking" || !sessionId}
              className="p-2.5 rounded-lg bg-elenchus-surface-2 border border-elenchus-border text-elenchus-chalk hover:bg-elenchus-terracotta hover:border-elenchus-terracotta transition-colors disabled:opacity-40"
              title="Submit text rebuttal"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </main>

      {/* Session Completion / Ambient Scribe Modal */}
      {sessionEndedSummary && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full rounded-2xl border border-elenchus-border bg-elenchus-surface-1 p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-elenchus-emerald flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sparring Duel Concluded</span>
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-elenchus-chalk font-bold">
                  Post-Debate Synthesis
                </h3>
              </div>
              <button
                onClick={() => setSessionEndedSummary(null)}
                className="p-1 rounded-md text-elenchus-muted hover:text-elenchus-chalk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Atomic Thought Card Component (Phase 4.4 & 4.5) */}
            {sessionEndedSummary.thought_card && (
              <div className="rounded-xl border border-elenchus-border bg-elenchus-surface-2/40 p-5">
                <AtomicThoughtCard
                  card={sessionEndedSummary.thought_card}
                  topicTitle={topic?.title}
                  totalTurns={sessionEndedSummary.total_turns}
                  finalStage={sessionEndedSummary.final_stage}
                  language={sessionEndedSummary.language}
                />
              </div>
            )}

            {/* Session Telemetry Strip */}
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-elenchus-border bg-elenchus-ground p-3.5 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-elenchus-muted">Total Volleys</span>
                <p className="text-elenchus-chalk font-semibold">{sessionEndedSummary.total_turns}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-elenchus-muted">Final Depth</span>
                <p className="text-elenchus-terracotta font-semibold">{sessionEndedSummary.final_stage}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-elenchus-muted">Language</span>
                <p className="text-elenchus-stone font-semibold">
                  {sessionEndedSummary.language === "hi-IN" ? "Hinglish (Poorvi)" : "English (Kaveri)"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3 rounded-lg bg-elenchus-terracotta hover:bg-elenchus-terracotta-hover text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all"
              >
                Return to Daily Drops
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
