"use client";

import { DialecticStage } from "@/types/spar";
import { Sparkles } from "lucide-react";

interface StageProgressProps {
  currentStage: DialecticStage;
  turnCount: number;
}

const STAGE_LABELS: Record<DialecticStage, { label: string; desc: string }> = {
  INTRO: { label: "EXPOSITION", desc: "Setting the premise" },
  CHALLENGE: { label: "FIRST CLASH", desc: "Probing initial instincts" },
  PUSHBACK: { label: "DIALECTIC FRICTION", desc: "Testing structural assumptions" },
  DEEPEN: { label: "COLLAPSING THE MODEL", desc: "Socratic examination & edge cases" },
  WRAP: { label: "SYNTHESIS", desc: "Distilling core insight" },
};

export function StageProgress({ currentStage, turnCount }: StageProgressProps) {
  const current = STAGE_LABELS[currentStage] || STAGE_LABELS.INTRO;

  return (
    <div className="w-full bg-elenchus-surface-2/60 border border-elenchus-border/60 rounded-xl px-4 py-2.5 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs font-mono">
        {/* Left: Mode Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-elenchus-terracotta opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-elenchus-terracotta" />
          </span>
          <span className="uppercase tracking-widest text-elenchus-muted text-[11px]">
            Dialectic Arena
          </span>
          <span className="text-elenchus-border">·</span>
          <span className="text-elenchus-chalk font-medium truncate max-w-[160px] sm:max-w-none">
            {current.label}
          </span>
        </div>

        {/* Right: Turn & Depth telemetry */}
        <div className="flex items-center gap-2 text-elenchus-stone">
          <span className="hidden sm:inline text-elenchus-muted text-[10px]">
            {current.desc}
          </span>
          <span className="hidden sm:inline text-elenchus-border">·</span>
          <span className="font-mono text-elenchus-terracotta font-semibold text-[11px]">
            TURN {String(turnCount).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}