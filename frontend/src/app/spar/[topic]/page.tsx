"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSparStore } from "@/lib/store";
import { api } from "@/lib/api";
import { AudioRecorder } from "@/lib/audioRecorder";
import { STARTER_TOPICS } from "@/lib/starterTopics";
import { Topic } from "@/types/topic";
import {
  ActiveSpeaker,
  DialogueSegmentPayload,
  DialecticStage,
  DialecticMode,
  EndSparResponse,
} from "@/types/spar";
import { VoiceOrb } from "@/components/spar/VoiceOrb";
import { StudioHeader } from "@/components/spar/StudioHeader";
import { TranscriptFeed } from "@/components/spar/TranscriptFeed";
import { AtomicThoughtCard } from "@/components/spar/AtomicThoughtCard";
import { saveThoughtCard } from "@/lib/vaultStorage";
import { registerActiveAudio, stopAllGlobalAudio } from "@/lib/audioManager";
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

interface AudioQueueItem {
  speaker: ActiveSpeaker;
  blob: Blob;
}

function base64ToWavBlob(b64: string): Blob {
  const byteCharacters = atob(b64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "audio/wav" });
}

export default function SparringArenaPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = (params?.topic as string) || "";

  const {
    user,
    mode,
    language,
    rigor,
    sessionId,
    stage,
    turns,
    micStatus,
    activeSpeaker,
    audioLevel,
    isComplete,
    errorMessage,
    setSession,
    addTurn,
    setMicStatus,
    setActiveSpeaker,
    setAudioLevel,
    setStage,
    setComplete,
    setError,
    setLastTopicInsight,
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
  const isMountedRef = useRef<boolean>(true);

  // Audio queue cascade refs
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);
  // Atomic kill-switch: set synchronously in stopAudioPlayback, checked first in every cascade callback
  const isStoppedRef = useRef<boolean>(false);
  // Push-to-talk recording lifecycle refs (ref-based for synchronous state tracking and zero stale closures)
  const isSpeakingRef = useRef<boolean>(false);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Helper: Stop all current and queued audio playback immediately
  const stopAudioPlayback = useCallback(() => {
    // Set kill-switch FIRST — before any async or React state updates
    isStoppedRef.current = true;
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    stopAllGlobalAudio();
    const player = audioPlayerRef.current;
    if (player) {
      // Null handlers before pause — prevents onended firing after pause
      player.onended = null;
      player.onerror = null;
      try { player.pause(); } catch {}
      try { player.currentTime = 0; } catch {}
      try { player.src = ""; } catch {}
      audioPlayerRef.current = null;
    }
    setActiveSpeaker("idle");
    setMicStatus("idle");
  }, [setActiveSpeaker, setMicStatus]);

  // Helper: Exit directly to studio with absolute silence
  const handleExitToStudio = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      stopAudioPlayback();
      router.push("/studio");
    },
    [router, stopAudioPlayback]
  );

  // Helper: Play the next segment in the audio cascade queue
  const playNextInQueue = useCallback(() => {
    // Kill-switch: bail out immediately if stopped or unmounted
    if (isStoppedRef.current || !isMountedRef.current || audioMuted || audioQueueRef.current.length === 0) {
      isPlayingQueueRef.current = false;
      if (!isStoppedRef.current) {
        setActiveSpeaker("idle");
        setMicStatus("idle");
      }
      return;
    }

    const item = audioQueueRef.current.shift()!;
    setActiveSpeaker(item.speaker);
    setMicStatus("speaking");

    const url = URL.createObjectURL(item.blob);
    // Always create a fresh Audio element so we never reuse a paused/nulled one
    const player = new Audio();
    audioPlayerRef.current = player;
    registerActiveAudio(player);
    player.src = url;

    player.onended = () => {
      URL.revokeObjectURL(url);
      if (!isStoppedRef.current) {
        playNextInQueue();
      }
    };

    player.onerror = () => {
      URL.revokeObjectURL(url);
      if (!isStoppedRef.current) {
        playNextInQueue();
      }
    };

    player.play().catch((err: unknown) => {
      console.warn("Autoplay was prevented by browser policy:", err);
      setAutoplayBlocked(true);
      setMicStatus("idle");
      setActiveSpeaker("idle");
      isPlayingQueueRef.current = false;
    });
  }, [audioMuted, setActiveSpeaker, setMicStatus]);

  // Enqueue and play multiple audio segments sequentially
  const enqueueAndPlayAudio = useCallback(
    (items: AudioQueueItem[]) => {
      if (audioMuted || items.length === 0) {
        setActiveSpeaker("idle");
        setMicStatus("idle");
        return;
      }
      // Reset kill-switch before starting a new audio cascade
      isStoppedRef.current = false;
      audioQueueRef.current = [...items];
      isPlayingQueueRef.current = true;
      playNextInQueue();
    },
    [audioMuted, playNextInQueue, setActiveSpeaker, setMicStatus]
  );

  // Single audio blob helper (for Sparring mode)
  const playAudioBlob = useCallback(
    (blob: Blob) => {
      enqueueAndPlayAudio([{ speaker: "host1", blob }]);
    },
    [enqueueAndPlayAudio]
  );

  // Ingest multi-speaker dialogue payload into store and audio queue
  const ingestDialogueSegments = useCallback(
    (
      dialogue: DialogueSegmentPayload[],
      turnStage: string,
      topicInsight?: string | null,
      explicitSessionId?: string
    ) => {
      isStoppedRef.current = false;
      const activeSessionId = explicitSessionId || sessionIdRef.current || sessionId || useSparStore.getState().sessionId;
      const queue: AudioQueueItem[] = [];

      dialogue.forEach((seg, idx) => {
        const isHost1 = seg.speaker === "Host1";
        const isHost2 = seg.speaker === "Host2";
        const role = isHost1 ? "HOST1" : isHost2 ? "HOST2" : "AI";
        const speakerName = isHost1
          ? language === "hi-IN"
            ? "Shivani"
            : language === "pa-IN"
            ? "Tarika"
            : language === "te-IN"
            ? "Lakshmi"
            : "Kalpana"
          : isHost2
          ? "Avinash"
          : "Elenchus Core";

        addTurn(role, seg.text, turnStage, {
          speakerName,
          speakerVoice: seg.voice,
          topic_insight: idx === 0 ? topicInsight : null,
          audio_base64: seg.audio_base64,
        });

        if (seg.audio_base64) {
          try {
            const blob = base64ToWavBlob(seg.audio_base64);
            queue.push({
              speaker: isHost2 ? "host2" : "host1",
              blob,
            });
          } catch (e) {
            console.warn("Failed to decode audio segment:", e);
          }
        } else if (activeSessionId && seg.turn_count !== undefined) {
          // Decoupled follower segment: synthesize in background and append to playback queue
          const targetSpeaker = isHost2 ? "host2" : "idle";
          const segIdx = seg.segment_index !== undefined ? seg.segment_index : idx;
          const targetTurn = seg.turn_count;

          const fetchFollowerAudio = async (retries = 3) => {
            for (let attempt = 0; attempt < retries; attempt++) {
              if (isStoppedRef.current) return;
              try {
                const res = await api.getSegmentAudio(activeSessionId, targetTurn, segIdx);
                if (res.ready && res.audio_base64 && !isStoppedRef.current) {
                  try {
                    const blob = base64ToWavBlob(res.audio_base64);
                    audioQueueRef.current.push({ speaker: targetSpeaker, blob });
                    console.log(`[AUDIO PIPELINE] Background audio arrived for ${targetSpeaker} (queue size: ${audioQueueRef.current.length})`);
                    // If Host 1 already finished, resume cascade immediately
                    if (!isPlayingQueueRef.current && !audioMuted) {
                      isPlayingQueueRef.current = true;
                      playNextInQueue();
                    }
                  } catch (decodeErr) {
                    console.warn("Failed to decode background audio segment:", decodeErr);
                  }
                  return;
                }
              } catch (err) {
                console.warn(`[AUDIO PIPELINE] Background segment fetch error (attempt ${attempt + 1}):`, err);
              }
              if (attempt < retries - 1 && !isStoppedRef.current) {
                await new Promise((resolve) => setTimeout(resolve, 800));
              }
            }
          };
          fetchFollowerAudio();
        }
      });

      if (queue.length > 0) {
        enqueueAndPlayAudio(queue);
      } else {
        setMicStatus("idle");
        setActiveSpeaker("idle");
      }
    },
    [addTurn, audioMuted, enqueueAndPlayAudio, language, playNextInQueue, setActiveSpeaker, setMicStatus]
  );


  // Resume audio if blocked by browser policy
  const handleResumeAutoplay = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play().then(() => {
        setAutoplayBlocked(false);
      });
    }
  };

  // 1. Initialize Topic & Session on mount
  useEffect(() => {
    isMountedRef.current = true;
    isStoppedRef.current = false;
    if (initializedRef.current) return;
    initializedRef.current = true;

    resetSession();

    // Check session storage for synthesized custom spark topic
    let foundTopic: Topic | null = null;
    try {
      const customRaw = sessionStorage.getItem(`custom-topic-${topicId}`);
      if (customRaw) {
        foundTopic = JSON.parse(customRaw);
      }
    } catch {
      // ignore
    }

    if (!foundTopic) {
      foundTopic = STARTER_TOPICS.find((t) => t.id === topicId) || null;
    }

    if (foundTopic) {
      setTopic(foundTopic);
    } else {
      setTopic({
        id: topicId,
        title: topicId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        category: "Cognitive Inquiry",
        summary: "Live Dialectic Sparring Session",
        opening_trap: "State your opening thesis to initiate the dialectic cross-examination.",
      });
    }

    setLoading(true);

    // Start dialectic session (text/dialogue payload)
    api
      .startSpar(topicId, language, mode, user?.name, rigor)
      .then((res) => {
        if (!isMountedRef.current) return;
        sessionIdRef.current = res.session_id;
        setSession(res.session_id, res.intro_text);
        setLoading(false);

        if (res.dialogue && res.dialogue.length > 0) {
          ingestDialogueSegments(res.dialogue, "STUDIO", null, res.session_id);
        } else {
          // Sparring mode fallback audio fetch
          addTurn("AI", res.intro_text, "INTRO");
          api
            .startSparAudio(topicId, language, mode, rigor)
            .then((audioRes) => {
              if (!isMountedRef.current) return;
              if (audioRes.audioBlob && audioRes.audioBlob.size > 0) {
                playAudioBlob(audioRes.audioBlob);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        console.error("Failed to start session:", err);
        setError(err instanceof Error ? err.message : "Failed to initiate session.");
        setLoading(false);
      });

    // Init Audio Recorder
    const recorder = new AudioRecorder({
      onVolumeChange: (vol) => {
        setAudioLevel(vol);
      },
    });

    recorderRef.current = recorder;

    return () => {
      isMountedRef.current = false;
      stopAudioPlayback();
      if (recorderRef.current) {
        recorderRef.current.stop().catch(() => {});
      }
    };
    // Only initialize session once on mount for the given topic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  // Stop playback on browser back/forward or page unload
  useEffect(() => {
    const handleNav = () => {
      stopAudioPlayback();
      stopAllGlobalAudio();
    };
    window.addEventListener("popstate", handleNav);
    window.addEventListener("pagehide", handleNav);
    window.addEventListener("beforeunload", handleNav);
    return () => {
      window.removeEventListener("popstate", handleNav);
      window.removeEventListener("pagehide", handleNav);
      window.removeEventListener("beforeunload", handleNav);
    };
  }, [stopAudioPlayback]);

  // 2. Instant Live Interruption & Push-to-Talk Handling
  const triggerStopSpeaking = useCallback(async () => {
    if (!recorderRef.current) return;

    // If start() is still resolving getUserMedia / audioContext, wait for it
    if (startPromiseRef.current) {
      try {
        await startPromiseRef.current;
      } catch {
        return;
      }
    }

    setMicStatus("thinking");
    setActiveSpeaker("idle");

    try {
      const audioBlob = await recorderRef.current.stop();
      if (!audioBlob || audioBlob.size < 1000) {
        setMicStatus("idle");
        return;
      }

      if (!sessionId) {
        setMicStatus("idle");
        return;
      }

      isStoppedRef.current = false;

      await api.sendTurnAudioStream(
        sessionId,
        audioBlob,
        {
          onTranscript: (text: string) => {
            // Emitted immediately upon STT completion (~1.5s into turn)
            addTurn("USER", text);
            setMicStatus("thinking");
          },
          onSegment: (seg: DialogueSegmentPayload) => {
            if (isStoppedRef.current) return;

            const isHost1 = seg.speaker === "Host1";
            const isHost2 = seg.speaker === "Host2";
            const role = isHost1 ? "HOST1" : isHost2 ? "HOST2" : "AI";
            const speakerName = isHost1
              ? language === "hi-IN"
                ? "Shivani"
                : language === "pa-IN"
                ? "Tarika"
                : language === "te-IN"
                ? "Lakshmi"
                : "Kalpana"
              : isHost2
              ? "Avinash"
              : "Elenchus Core";

            // Ingest segment into transcript feed
            addTurn(role, seg.text, "STUDIO", {
              speakerName,
              speakerVoice: seg.voice,
              audio_base64: seg.audio_base64,
            });

            // Decode and enqueue 24kHz synthesized audio
            if (seg.audio_base64 && !isStoppedRef.current) {
              try {
                const blob = base64ToWavBlob(seg.audio_base64);
                const targetSpeaker: ActiveSpeaker = isHost1 ? "host1" : isHost2 ? "host2" : "host1";
                const item: AudioQueueItem = { speaker: targetSpeaker, blob };

                audioQueueRef.current.push(item);
                if (!isPlayingQueueRef.current && !audioMuted) {
                  isPlayingQueueRef.current = true;
                  playNextInQueue();
                }
              } catch (e) {
                console.warn("Failed to decode audio segment:", e);
              }
            }
          },
          onMetadata: (meta) => {
            if (meta.stage) setStage(meta.stage as DialecticStage);
            if (meta.is_complete !== undefined) setComplete(meta.is_complete);
            if (meta.topic_insight) setLastTopicInsight(meta.topic_insight);
          },
          onDone: () => {
            if (!isPlayingQueueRef.current && audioQueueRef.current.length === 0) {
              setMicStatus("idle");
              setActiveSpeaker("idle");
            }
          },
          onError: (err) => {
            console.warn("Streaming audio turn error:", err);
          },
        },
        language
      );
    } catch (err: unknown) {
      console.warn("Spoken turn aborted or too short:", err);
      const msg = err instanceof Error ? err.message : "Error exchanging spoken turn";
      // If user tapped or held too briefly, quietly return to idle without jarring red error
      if (msg.includes("too short")) {
        setMicStatus("idle");
        setActiveSpeaker("idle");
        return;
      }
      setError(msg);
      setMicStatus("idle");
      setActiveSpeaker("idle");
    }
  }, [
    sessionId,
    language,
    addTurn,
    setStage,
    setComplete,
    setLastTopicInsight,
    audioMuted,
    playNextInQueue,
    setError,
    setMicStatus,
    setActiveSpeaker,
  ]);

  const handleStartSpeaking = useCallback(async () => {
    if (isSpeakingRef.current || loading || isComplete || !recorderRef.current) return;

    // Synchronous guard flag
    isSpeakingRef.current = true;

    // Instant Interruption Affordance:
    // Instantly halt host audio playback and flush the remaining cascade queue
    stopAudioPlayback();

    setActiveSpeaker("user");
    setMicStatus("listening");

    const promise = recorderRef.current.start();
    startPromiseRef.current = promise;

    try {
      await promise;
    } catch (err: unknown) {
      console.error("Microphone activation failed:", err);
      isSpeakingRef.current = false;
      startPromiseRef.current = null;
      setActiveSpeaker("idle");
      setMicStatus("error");
      setError("Could not activate microphone. Check browser permissions.");
      return;
    }

    startPromiseRef.current = null;

    // Edge case: User released Spacebar / button WHILE start() was initializing
    if (!isSpeakingRef.current) {
      triggerStopSpeaking();
    }
  }, [loading, isComplete, stopAudioPlayback, setActiveSpeaker, setMicStatus, setError, triggerStopSpeaking]);

  const handleStopSpeaking = useCallback(() => {
    if (!isSpeakingRef.current) return;
    isSpeakingRef.current = false;
    triggerStopSpeaking();
  }, [triggerStopSpeaking]);

  // 3. Fallback Text Rebuttal Handling
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || loading || !sessionId || micStatus === "thinking") return;

    const userText = textInput.trim();
    setTextInput("");

    // Stop host playback if active
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    addTurn("USER", userText);
    setMicStatus("thinking");
    setActiveSpeaker("idle");

    try {
      const res = await api.sendTurnText(sessionId, userText, language);

      setStage(res.stage);
      setComplete(res.is_complete);

      if (res.dialogue && res.dialogue.length > 0) {
        ingestDialogueSegments(res.dialogue, res.stage, res.topic_insight, res.session_id || sessionId);
      } else {
        addTurn("AI", res.ai_response, res.stage);
        setMicStatus("idle");
      }
    } catch (err: unknown) {
      console.error("Text rebuttal error:", err);
      setError("Failed to transmit text rebuttal.");
      setMicStatus("idle");
      setActiveSpeaker("idle");
    }
  };

  // 4. End Session & Synthesize Thought Card
  const handleEndSession = async () => {
    if (!sessionId) {
      router.push("/studio");
      return;
    }

    // Stop playback
    stopAudioPlayback();

    setLoading(true);
    try {
      const summary = await api.endSpar(sessionId);
      setSessionEndedSummary(summary);
      if (summary.thought_card) {
        saveThoughtCard(
          {
            topicId,
            topicTitle: topic?.title || topicId,
            category: topic?.category,
            mode: (mode as DialecticMode) || "podcast",
            language,
            totalTurns: summary.total_turns,
            finalStage: summary.final_stage,
            card: summary.thought_card,
          },
          user?.email || user?.sub || null,
        );
      }
      setComplete(true);
    } catch (err: unknown) {
      console.warn("End spar error, using fallback synthesis:", err);
      const fallbackSummary: EndSparResponse = {
        session_id: sessionId,
        topic_id: topicId,
        total_turns: turns.length,
        final_stage: (stage as DialecticStage) || "WRAP",
        language,
        history: turns.map((t) => ({
          role: t.role === "USER" ? "USER" : "AI",
          text: t.text,
        })),
        thought_card: {
          core_thesis: topic?.summary || "Dialectical inquiry",
          user_stance:
            turns.filter((t) => t.role === "USER").pop()?.text ||
            "Premise submitted during discussion",
          blind_spots: "Premise examined across causal edge-cases.",
          key_insight: "Clarity distilled through real-time dialectical friction.",
        },
      };
      setSessionEndedSummary(fallbackSummary);
      if (fallbackSummary.thought_card) {
        saveThoughtCard(
          {
            topicId,
            topicTitle: topic?.title || topicId,
            category: topic?.category,
            mode: (mode as DialecticMode) || "podcast",
            language,
            totalTurns: fallbackSummary.total_turns,
            finalStage: fallbackSummary.final_stage,
            card: fallbackSummary.thought_card,
          },
          user?.email || user?.sub || null,
        );
      }
      setComplete(true);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Spacebar push-to-talk
  useEffect(() => {
    const isInputElement = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        el.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (isInputElement(e.target)) return;
        // Always prevent page scrolling on Spacebar
        e.preventDefault();
        // Ignore OS repeated keydown events while holding Spacebar
        if (e.repeat) return;
        handleStartSpeaking();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (isInputElement(e.target)) return;
        e.preventDefault();
        handleStopSpeaking();
      }
    };

    const handleWindowBlur = () => {
      // Safety: If user Alt-Tabs or window loses focus while holding Space, release mic
      handleStopSpeaking();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [handleStartSpeaking, handleStopSpeaking]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9] text-[#0f0f10] selection:bg-[#0f0f10]/12 antialiased">
      {/* 1. Top Studio/Arena Navigation Bar */}
      <nav className="border-b border-[#0f0f10]/10 bg-[#fbfbf9]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-40">
        <button
          type="button"
          onClick={handleExitToStudio}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10]/70 hover:text-[#0f0f10] hover:scale-105 transition-all duration-200 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Studio</span>
        </button>

        {/* Center Topic Title & Live Badge */}
        <div className="flex items-center gap-3 truncate">
          <span className="font-serif font-semibold text-base sm:text-lg text-[#0f0f10] tracking-tight truncate max-w-xs sm:max-w-md">
            {topic?.title || (mode === "podcast" ? "Podcast Studio Roundtable" : "Socratic Duel")}
          </span>
          {sessionId ? (
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 shrink-0 font-medium shadow-xs">
              {mode === "podcast" ? "ROUNDTABLE LIVE" : "ACTIVE DUEL"}
            </span>
          ) : (
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase px-2.5 py-0.5 rounded-md bg-[#b8945c]/10 text-[#b8945c] animate-pulse shrink-0 font-medium">
              CONNECTING...
            </span>
          )}
        </div>

        {/* Right Session Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-2 rounded-lg bg-[#0f0f10]/[0.05] text-[#0f0f10]/70 hover:text-[#0f0f10] hover:scale-105 transition-all duration-200 shadow-xs"
            title={audioMuted ? "Unmute dialogue audio" : "Mute dialogue audio"}
          >
            {audioMuted ? (
              <VolumeX className="w-4 h-4 text-rose-600" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleEndSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 font-mono text-xs uppercase tracking-wider text-rose-700 hover:bg-rose-600 hover:text-white hover:scale-105 transition-all duration-200 shadow-xs"
          >
            <Flag className="w-3 h-3" />
            <span className="hidden sm:inline">Conclude</span>
          </button>
        </div>
      </nav>

      {/* Browser Autoplay Interceptor Banner */}
      {autoplayBlocked && (
        <div className="bg-white/95 border-b border-[#b8945c]/30 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-[#0f0f10] shadow-2xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#b8945c] animate-pulse" />
            <span>Browser paused conversational audio. Click to hear interlocutors.</span>
          </div>
          <button
            type="button"
            onClick={handleResumeAutoplay}
            className="px-3 py-1 border border-[#0f0f10] bg-[#0f0f10] text-[#fbfbf9] font-medium hover:bg-neutral-800 transition-colors shadow-2xs"
          >
            Play Voice
          </button>
        </div>
      )}

      {/* Optional Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:text-black"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Main Dialectic Workspace Split View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Live Presence Bar & Transcript Feed (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[65vh] lg:h-[calc(100vh-140px)] border border-[#0f0f10]/12 bg-white/60 backdrop-blur-md p-4 sm:p-6 space-y-6 shadow-2xs">
          <StudioHeader
            mode={mode}
            language={language}
            activeSpeaker={activeSpeaker}
            userName={user?.name}
            topicTitle={topic?.title}
            turnCount={turns.length}
          />
          <div className="flex-1 overflow-hidden">
            <TranscriptFeed
              turns={turns}
              isThinking={micStatus === "thinking"}
              mode={mode}
            />
          </div>
        </section>

        {/* Right Column: Voice Orb & Interactive Desk (5 cols) */}
        <section className="lg:col-span-5 flex flex-col justify-between border border-[#0f0f10]/12 bg-white/80 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-2xs">
          {/* Top Dialectic Status Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#0f0f10]/10 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#0f0f10]/50">
                  {mode === "podcast" ? "Studio Control Desk" : "Voice Core & Engine"}
                </span>
                <p className="font-mono text-xs font-semibold text-[#b8945c]">
                  {language === "hi-IN"
                    ? "HINGLISH · SHIVANI & AVINASH"
                    : language === "pa-IN"
                    ? "PUNJABI · TARIKA & AVINASH"
                    : language === "te-IN"
                    ? "TELUGU · LAKSHMI & AVINASH"
                    : "INDIAN ENGLISH · KALPANA & AVINASH"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-md font-semibold border ${
                    rigor === "mentor"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : rigor === "expert" || rigor === "hardcore"
                      ? "bg-rose-50 text-rose-800 border-rose-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  {rigor === "mentor" ? "Mentor" : rigor === "expert" || rigor === "hardcore" ? "Expert" : "Balanced"}
                </span>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-md bg-[#0f0f10]/[0.04] text-[#0f0f10]/60 font-medium">
                  {language === "hi-IN"
                    ? "Hinglish (Shivani)"
                    : language === "pa-IN"
                    ? "Punjabi (Tarika)"
                    : language === "te-IN"
                    ? "Telugu (Lakshmi)"
                    : "English (Kalpana)"}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#0f0f10]/70 leading-relaxed font-normal">
              {mode === "podcast"
                ? "Hold the core or SPACE to weigh in. Tap at any time to interrupt the hosts and state your counter-premise."
                : "Hold the core to speak, or hold SPACE. Release when you have stated your premise."}
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
              activeSpeaker={activeSpeaker}
              mode={mode}
              language={language}
            />
          </div>

          {/* Text Fallback Rebuttal Input */}
          <form
            onSubmit={handleTextSubmit}
            className="flex items-center gap-2 pt-4 border-t border-[#0f0f10]/10"
          >
            <input
              ref={textInputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                sessionId
                  ? language === "hi-IN"
                    ? "अपना counter-argument यहाँ type करें..."
                    : language === "pa-IN"
                    ? "ਆਪਣਾ counter-argument ਇੱਥੇ ਲਿਖੋ..."
                    : language === "te-IN"
                    ? "మీ counter-argument ఇక్కడ టైప్ చేయండి..."
                    : mode === "podcast"
                    ? "Weigh into the roundtable in text..."
                    : "Or type your counter-argument here..."
                  : "Connecting to Dialectic Core..."
              }
              disabled={loading || micStatus === "thinking" || !sessionId}
              className="flex-1 px-4 py-2.5 bg-[#0f0f10]/[0.04] rounded-xl text-[#0f0f10] placeholder:text-[#0f0f10]/40 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#b8945c] focus:bg-white transition-all disabled:opacity-50 shadow-xs"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || micStatus === "thinking" || !sessionId}
              className="p-2.5 rounded-xl bg-[#b8945c] hover:bg-[#a07e4a] text-white hover:scale-105 transition-all disabled:opacity-40 shadow-xs"
              title="Submit text rebuttal"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </main>

      {/* 3. Session Completion / Ambient Scribe Modal */}
      {sessionEndedSummary && (
        <div className="fixed inset-0 z-50 bg-[#0f0f10]/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="max-w-2xl w-full rounded-2xl bg-[#fbfbf9] p-6 sm:p-8 space-y-6 shadow-2xl my-8 text-[#0f0f10]">
            <div className="flex items-start justify-between gap-4 border-b border-[#0f0f10]/10 pb-4">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-emerald-700 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#b8945c]" />
                  <span>
                    {mode === "podcast" ? "Roundtable Concluded" : "Sparring Duel Concluded"}
                  </span>
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#0f0f10] font-semibold tracking-tight">
                  Post-Debate Synthesis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSessionEndedSummary(null)}
                className="p-2 rounded-lg bg-[#0f0f10]/[0.05] hover:bg-[#0f0f10]/10 text-[#0f0f10] hover:scale-105 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Atomic Thought Card Component */}
            {sessionEndedSummary.thought_card && (
              <div className="border border-[#0f0f10]/10 bg-white/70 p-5 shadow-2xs">
                <AtomicThoughtCard
                  card={sessionEndedSummary.thought_card}
                  topicTitle={topic?.title}
                  topicId={topicId}
                  totalTurns={sessionEndedSummary.total_turns}
                  finalStage={sessionEndedSummary.final_stage}
                  language={sessionEndedSummary.language}
                  mode={(mode as DialecticMode) || "podcast"}
                  isSaved={true}
                />
              </div>
            )}

            {/* Session Telemetry Strip */}
            <div className="grid grid-cols-3 gap-3 border border-[#0f0f10]/10 bg-white/80 p-4 font-mono text-xs shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-[#0f0f10]/50 tracking-wider">
                  Total Beats
                </span>
                <p className="text-[#0f0f10] font-semibold">
                  {sessionEndedSummary.total_turns}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-[#0f0f10]/50 tracking-wider">
                  Modality
                </span>
                <p className="text-[#b8945c] font-semibold">
                  {mode === "podcast" ? "Podcast Studio" : "Sparring Arena"}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-[#0f0f10]/50 tracking-wider">
                  Language
                </span>
                <p className="text-[#0f0f10]/80 font-semibold">
                  {sessionEndedSummary.language === "hi-IN"
                    ? "Hinglish (Shivani)"
                    : sessionEndedSummary.language === "pa-IN"
                    ? "Punjabi (Tarika)"
                    : sessionEndedSummary.language === "te-IN"
                    ? "Telugu (Lakshmi)"
                    : "English (Kalpana)"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleExitToStudio}
                className="flex-1 py-3 rounded-xl bg-[#b8945c] hover:bg-[#a07e4a] text-white hover:scale-[1.02] active:scale-[0.98] font-mono text-xs uppercase tracking-wider font-medium transition-all shadow-xs"
              >
                Return to Studio Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
