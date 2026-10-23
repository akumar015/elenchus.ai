"use client";

import { useMemo } from "react";
import { Mic, Loader2, Volume2, Sparkles } from "lucide-react";
import { MicStatus } from "@/types/spar";

interface VoiceOrbProps {
  status: MicStatus;
  audioLevel: number; // 0.0 - 1.0
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled?: boolean;
}

export function VoiceOrb({
  status,
  audioLevel,
  onPressStart,
  onPressEnd,
  disabled = false,
}: VoiceOrbProps) {
  // Compute dynamic scale based on real-time audio volume
  const dynamicScale = useMemo(() => {
    if (status === "listening") {
      return 1 + audioLevel * 0.45;
    }
    return 1;
  }, [status, audioLevel]);

  // Label text depending on dialectic state
  const stateLabel = useMemo(() => {
    switch (status) {
      case "listening":
        return "LISTENING · RELEASE TO SEND";
      case "thinking":
        return "DECONSTRUCTING ARGUMENT...";
      case "speaking":
        return "ELENCHUS SPARRING...";
      case "error":
        return "MIC ERROR · CLICK TO RETRY";
      default:
        return "HOLD TO SPEAK (OR SPACEBAR)";
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 select-none">
      {/* Central Interactive Orb Core */}
      <div className="relative flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60">
        {/* Outer Acoustic Ripple Ring (Speaking Mode) */}
        {status === "speaking" && (
          <>
            <div className="absolute inset-0 rounded-full border border-elenchus-terracotta/40 animate-ripple" />
            <div
              className="absolute inset-0 rounded-full border border-elenchus-terracotta/20 animate-ripple"
              style={{ animationDelay: "0.6s" }}
            />
          </>
        )}

        {/* Orbital Spinner Ring (Thinking Mode) */}
        {status === "thinking" && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-elenchus-terracotta/60 animate-spin-slow" />
        )}

        {/* Concentric Telemetry Guidance Rings */}
        <div
          className={`absolute inset-4 rounded-full border transition-all duration-300 ${
            status === "listening"
              ? "border-elenchus-terracotta/50"
              : status === "thinking"
              ? "border-elenchus-amber/40"
              : status === "speaking"
              ? "border-elenchus-terracotta/60"
              : "border-elenchus-border/60"
          }`}
          style={{
            transform: `scale(${dynamicScale})`,
            transition: "transform 75ms ease-out",
          }}
        />

        <div className="absolute inset-8 rounded-full border border-elenchus-border/40" />

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
            if (status === "listening") onPressEnd();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (!disabled && status !== "thinking") onPressStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (status === "listening") onPressEnd();
          }}
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-elenchus-terracotta/50 ${
            status === "listening"
              ? "bg-elenchus-terracotta text-white shadow-2xl shadow-elenchus-terracotta/50 scale-105"
              : status === "thinking"
              ? "bg-elenchus-surface-3 text-elenchus-amber cursor-wait"
              : status === "speaking"
              ? "bg-elenchus-surface-2 text-elenchus-terracotta border-2 border-elenchus-terracotta animate-breathe-slow shadow-lg shadow-elenchus-terracotta/20"
              : "bg-elenchus-surface-2 hover:bg-elenchus-surface-3 text-elenchus-chalk border border-elenchus-border hover:border-elenchus-terracotta/50 shadow-lg shadow-black/40"
          }`}
          style={{
            touchAction: "none",
          }}
          aria-label={stateLabel}
        >
          {status === "listening" ? (
            <div className="flex flex-col items-center gap-1">
              <Mic className="w-8 h-8 animate-pulse text-white" />
              <div className="flex gap-0.5 items-end h-3">
                <span className="w-1 bg-white rounded-full animate-bounce h-2" />
                <span className="w-1 bg-white rounded-full animate-bounce h-3 delay-75" />
                <span className="w-1 bg-white rounded-full animate-bounce h-1.5 delay-150" />
              </div>
            </div>
          ) : status === "thinking" ? (
            <Loader2 className="w-8 h-8 animate-spin text-elenchus-amber" />
          ) : status === "speaking" ? (
            <div className="flex flex-col items-center gap-1">
              <Volume2 className="w-8 h-8 text-elenchus-terracotta animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-elenchus-terracotta">
                AI SPARRING
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Mic className="w-7 h-7 text-elenchus-stone group-hover:text-elenchus-chalk transition-colors" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-elenchus-muted">
                HOLD
              </span>
            </div>
          )}
        </button>
      </div>

      {/* State Cue Label */}
      <div className="flex items-center gap-2 font-mono text-xs text-elenchus-stone tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-elenchus-terracotta" />
        <span>{stateLabel}</span>
      </div>
    </div>
  );
}
