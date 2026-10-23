"use client";

import { DialecticStage } from "@/types/spar";
import { Check } from "lucide-react";

interface StageProgressProps {
  currentStage: DialecticStage;
  turnCount: number;
}

const STAGES: Array<{ id: DialecticStage; label: string; number: string }> = [
  { id: "INTRO", label: "Opening Trap", number: "01" },
  { id: "CHALLENGE", label: "First Clash", number: "02" },
  { id: "PUSHBACK", label: "Dialectic Push", number: "03" },
  { id: "DEEPEN", label: "Deepening", number: "04" },
  { id: "WRAP", label: "Synthesis", number: "05" },
];

export function StageProgress({ currentStage, turnCount }: StageProgressProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full space-y-3">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between text-xs font-mono text-elenchus-stone">
        <span className="uppercase tracking-widest text-elenchus-muted">
          Dialectic Progression
        </span>
        <div className="flex items-center gap-2">
          <span className="text-elenchus-terracotta font-semibold">
            STAGE: {currentStage}
          </span>
          <span className="text-elenchus-muted">·</span>
          <span>TURN: {String(turnCount).padStart(2, "0")}/05</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-5 gap-2">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.id} className="space-y-1.5">
              {/* Segment Bar */}
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? "bg-elenchus-emerald"
                    : isCurrent
                    ? "bg-elenchus-terracotta animate-pulse"
                    : "bg-elenchus-surface-3"
                }`}
              />

              {/* Step Label */}
              <div className="flex items-center gap-1">
                <span
                  className={`font-mono text-[10px] hidden sm:inline ${
                    isCurrent
                      ? "text-elenchus-terracotta font-semibold"
                      : isDone
                      ? "text-elenchus-emerald"
                      : "text-elenchus-muted"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-2.5 h-2.5 inline" />
                  ) : (
                    stage.number
                  )}
                </span>
                <span
                  className={`font-mono text-[10px] truncate ${
                    isCurrent
                      ? "text-elenchus-chalk font-medium"
                      : isDone
                      ? "text-elenchus-stone"
                      : "text-elenchus-muted"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
