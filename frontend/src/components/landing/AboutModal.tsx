"use client";

import React, { useEffect } from "react";
import { X, Sparkles, Compass, Shield, ArrowRight } from "lucide-react";
import { useSparStore } from "@/lib/store";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreArchitecture?: () => void;
  onTryDemo?: () => void;
}

export function AboutModal({
  isOpen,
  onClose,
  onExploreArchitecture,
  onTryDemo,
}: AboutModalProps) {
  const user = useSparStore((state) => state.user);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="About elenchus.ai"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#0f0f10]/40 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-[#fbfbf9]/95 border border-[#0f0f10]/15 shadow-2xl p-6 sm:p-8 md:p-10 text-[#0f0f10] space-y-7">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#0f0f10]/10 pb-5">
          <div className="space-y-1">
            <div className="font-mono text-xs uppercase tracking-widest text-[#0f0f10]/60 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[#0f0f10]" />
              <span>About · elenchus.ai [ἔλεγχος]</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
              The Dialectical Voice Companion
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 border border-[#0f0f10]/15 hover:bg-[#0f0f10] hover:text-[#fbfbf9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative */}
        <div className="space-y-5 text-sm leading-relaxed text-[#2a2a2e]">
          <p className="text-base font-light text-[#0f0f10]">
            <strong className="font-medium">elenchus.ai</strong> is engineered for thinkers who have outgrown passive consumption. Traditional podcasts and summaries induce an illusion of competence—the mind confuses recognition with actual understanding.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white/70 border border-[#0f0f10]/10 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#b8945c]" />
                <span>The Socratic Method</span>
              </div>
              <p className="text-xs text-[#2a2a2e]/85">
                Named after Socrates’ method of cross-examination (<em>elenchus</em>), the system probes your stated premises, surfaces hidden assumptions, and forces real-time counter-arguments.
              </p>
            </div>

            <div className="p-4 bg-white/70 border border-[#0f0f10]/10 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10] font-semibold">
                <Shield className="w-3.5 h-3.5 text-[#b8945c]" />
                <span>True Retention</span>
              </div>
              <p className="text-xs text-[#2a2a2e]/85">
                Memory is the residue of defended thought. Verbal defense triggers the generation effect and spontaneous retrieval practice, locking concepts into long-term recall.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#2a2a2e]/75 font-mono">
            [ Zero monologues · Conversational volleys · Dialectic clarity ]
          </p>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-[#0f0f10]/10 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          {onExploreArchitecture && (
            <button
              onClick={() => {
                onClose();
                onExploreArchitecture();
              }}
              className="w-full sm:w-auto text-[#0f0f10]/70 hover:text-[#0f0f10] underline underline-offset-4 tracking-wider flex items-center gap-1.5 py-1"
            >
              <span>View Cognitive Architecture</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-[#0f0f10]/20 hover:border-[#0f0f10] transition-colors uppercase tracking-wider font-mono text-xs"
            >
              Close
            </button>
            {onTryDemo && (
              <button
                onClick={() => {
                  onClose();
                  onTryDemo();
                }}
                className="px-6 py-2.5 border border-[#0f0f10] bg-[#0f0f10] text-[#fbfbf9] hover:bg-neutral-800 transition-colors uppercase tracking-wider font-medium flex items-center gap-2 shadow-2xs font-mono text-xs"
              >
                <span>{user ? "Enter Studio" : "Try Demo"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
