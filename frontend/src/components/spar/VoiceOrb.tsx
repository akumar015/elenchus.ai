"use client";

import { useMemo, useState, useEffect } from "react";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { ActiveSpeaker, DialecticMode, MicStatus, SparLanguage } from "@/types/spar";

interface VoiceOrbProps {
  status: MicStatus;
  audioLevel: number; // 0.0 - 1.0
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled?: boolean;
  activeSpeaker?: ActiveSpeaker;
  mode?: DialecticMode;
  language?: SparLanguage;
}

const THINKING_CADENCES = [
  "DISSECTING PREMISE...",
  "SEARCHING FOR LOGICAL CONTRADICTIONS...",
  "SYNTHESIZING ADVERSARIAL TRAP...",
];

export function VoiceOrb({
  status,
  audioLevel,
  onPressStart,
  onPressEnd,
  disabled = false,
  activeSpeaker = "idle",
  mode = "podcast",
  language = "en-IN",
}: VoiceOrbProps) {
  const [cadenceIndex, setCadenceIndex] = useState(0);

  // Cycle cognitive cadence cues during thinking state
  useEffect(() => {
    if (status !== "thinking") {
      setCadenceIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCadenceIndex((prev) => (prev + 1) % THINKING_CADENCES.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [status]);

  // Compute dynamic scale based on real-time audio volume
  const dynamicScale = useMemo(() => {
    if (status === "listening") {
      return 1 + audioLevel * 0.45;
    }
    return 1;
  }, [status, audioLevel]);

  // Label text depending on dialectic state and active speaker
  const stateLabel = useMemo(() => {
    switch (status) {
      case "listening":
        return "TRANSMITTING PREMISE · RELEASE TO SEND";
      case "thinking":
        return THINKING_CADENCES[cadenceIndex];
      case "speaking":
        if (mode === "podcast") {
          if (activeSpeaker === "host1") {
            return language === "hi-IN"
              ? "SHIVANI ON AIR · THE ANCHOR"
              : language === "pa-IN"
              ? "TARIKA ON AIR · THE ANCHOR"
              : language === "te-IN"
              ? "LAKSHMI ON AIR · THE ANCHOR"
              : "KALPANA ON AIR · THE ANCHOR";
          }
          if (activeSpeaker === "host2") {
            return "AVINASH ON AIR · THE PROVOCATEUR";
          }
          return "HOSTS CONVERSING...";
        }
        return "ELENCHUS SPARRING...";
      case "error":
        return "MIC ERROR · CLICK TO RETRY";
      default:
        return mode === "podcast"
          ? "WEIGH IN (HOLD SPACEBAR OR TAP)"
          : "HOLD TO SPEAK (OR SPACEBAR)";
    }
  }, [status, cadenceIndex, mode, activeSpeaker, language]);

  // Dynamic theme colors
  const activeColor = useMemo(() => {
    if (status === "listening") return "#059669"; // emerald
    if (activeSpeaker === "host2") return "#c86446"; // terracotta
    return "#b8945c"; // warm gold / amber (host1 & spar AI)
  }, [status, activeSpeaker]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 select-none">
      {/* Central Interactive Orb Core */}
      <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
        {/* Outer Acoustic Ripple Ring (Speaking Mode) */}
        {status === "speaking" && (
          <>
            <div
              className="absolute inset-0 rounded-full border animate-ping"
              style={{ borderColor: `${activeColor}80` }}
            />
            <div
              className="absolute inset-4 rounded-full border animate-pulse"
              style={{ borderColor: `${activeColor}4d` }}
            />
          </>
        )}

        {/* Orbital Spinner Ring (Thinking Mode) */}
        {status === "thinking" && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#b8945c]/60 animate-spin" />
        )}

        {/* Concentric Telemetry Guidance Rings */}
        <div
          className={`absolute inset-4 rounded-full border transition-all duration-300 ${
            status === "listening"
              ? "border-emerald-600/70 shadow-lg shadow-emerald-600/20"
              : status === "thinking"
              ? "border-[#b8945c]/40"
              : status === "speaking"
              ? "shadow-lg"
              : "border-[#0f0f10]/10"
          }`}
          style={{
            borderColor: status === "speaking" ? `${activeColor}99` : undefined,
            boxShadow: status === "speaking" ? `0 10px 25px -5px ${activeColor}33` : undefined,
            transform: `scale(${dynamicScale})`,
            transition: "transform 75ms ease-out, border-color 200ms ease",
          }}
        />

        <div className="absolute inset-8 rounded-full border border-[#0f0f10]/8" />

        {/* Interactive Push-to-Talk Button (The Core) */}
        <button
          type="button"
          disabled={disabled || status === "thinking"}
          onMouseDown={(e) => {
            e.preventDefault();
            if (!disabled && status !== "thinking") onPressStart();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            onPressEnd();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (!disabled && status !== "thinking") onPressStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onPressEnd();
          }}
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#b8945c]/50 ${
            status === "listening"
              ? "bg-[#0f0f10] text-[#fbfbf9] shadow-2xl scale-105"
              : status === "thinking"
              ? "bg-white/80 text-[#b8945c] border border-[#b8945c]/40 cursor-wait shadow-sm"
              : status === "speaking"
              ? "bg-white animate-pulse shadow-lg"
              : "bg-white/90 hover:bg-white text-[#0f0f10] border border-[#0f0f10]/15 hover:border-[#b8945c] shadow-lg shadow-[#0f0f10]/5"
          }`}
          style={{
            borderColor: status === "speaking" ? activeColor : undefined,
            color: status === "speaking" ? activeColor : undefined,
            touchAction: "none",
          }}
          aria-label={stateLabel}
        >
          {status === "listening" ? (
            <div className="flex flex-col items-center gap-1">
              <Mic className="w-8 h-8 text-emerald-500 animate-pulse" />
              <div className="flex gap-0.5 items-end h-3">
                <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-2" />
                <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-3 delay-75" />
                <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-1.5 delay-150" />
              </div>
            </div>
          ) : status === "thinking" ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#b8945c]" />
          ) : status === "speaking" ? (
            <div className="flex flex-col items-center gap-1">
              <Volume2 className="w-8 h-8 animate-pulse" style={{ color: activeColor }} />
              <span
                className="font-mono text-[9px] uppercase tracking-widest font-semibold"
                style={{ color: activeColor }}
              >
                {mode === "podcast"
                  ? activeSpeaker === "host1"
                    ? language === "hi-IN"
                      ? "SHIVANI"
                      : language === "pa-IN"
                      ? "TARIKA"
                      : language === "te-IN"
                      ? "LAKSHMI"
                      : "KALPANA"
                    : activeSpeaker === "host2"
                    ? "AVINASH"
                    : "ON AIR"
                  : "SPARRING"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Mic className="w-7 h-7 text-[#0f0f10]/70 group-hover:text-[#0f0f10] transition-colors" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0f0f10]/50 font-medium">
                {mode === "podcast" ? "WEIGH IN" : "HOLD"}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* State Cue Label */}
      <div className="flex items-center justify-center font-mono text-xs text-[#0f0f10]/70 tracking-wider min-h-[1.25rem]">
        <span className="truncate">{stateLabel}</span>
      </div>
    </div>
  );
}
