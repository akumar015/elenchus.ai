"use client";

import { DialecticStage } from "@/types/spar";

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
  STUDIO: { label: "ROUNDTABLE", desc: "Co-host dialectic debate" },
};

export function StageProgress({ currentStage, turnCount }: StageProgressProps) {
  const current = STAGE_LABELS[currentStage] || STAGE_LABELS.INTRO;

  return (
    <div className="w-full bg-white/80 border border-[#0f0f10]/12 px-4 py-2.5 backdrop-blur-sm shadow-2xs">
      <div className="flex items-center justify-between text-xs font-mono">
        {/* Left: Mode Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b8945c] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b8945c]" />
          </span>
          <span className="uppercase tracking-widest text-[#0f0f10]/50 text-[11px]">
            Dialectic Arena
          </span>
          <span className="text-[#0f0f10]/20">·</span>
          <span className="text-[#0f0f10] font-medium truncate max-w-[160px] sm:max-w-none">
            {current.label}
          </span>
        </div>

        {/* Right: Turn & Depth telemetry */}
        <div className="flex items-center gap-2 text-[#0f0f10]/70">
          <span className="hidden sm:inline text-[#0f0f10]/50 text-[10px]">
            {current.desc}
          </span>
          <span className="hidden sm:inline text-[#0f0f10]/20">·</span>
          <span className="font-mono text-[#b8945c] font-semibold text-[11px]">
            TURN {String(turnCount).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
