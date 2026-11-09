"use client";

import React, { useEffect } from "react";
import { X, Brain, Sparkles, Layers, Zap, BookOpen } from "lucide-react";

interface CognitiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: "inquiry" | "frequencies" | "privacy";
}

export function CognitiveModal({
  isOpen,
  onClose,
  activeTab = "inquiry",
}: CognitiveModalProps) {
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
      aria-label="Cognitive Foundations & System Dynamics"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#0f0f10]/35 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#fbfbf9]/95 border border-[#0f0f10]/15 shadow-2xl p-6 sm:p-8 md:p-10 text-[#0f0f10] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#0f0f10]/10 pb-5">
          <div className="space-y-1">
            <div className="font-mono text-xs uppercase tracking-widest text-[#0f0f10]/60 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-[#0f0f10]" />
              <span>Cognitive Architecture · elenchus.ai [{activeTab}]</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
              The Dialectic Retention Engine
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

        {/* Content Tabs / Frameworks */}
        <div className="space-y-6 text-sm leading-relaxed text-[#2a2a2e]">
          {/* 1. ICAP Framework */}
          <div className="p-4 bg-white/70 border border-[#0f0f10]/10 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10] font-semibold">
              <Layers className="w-4 h-4 text-[#d95d39]" />
              <span>1. The ICAP Framework (Michelene Chi)</span>
            </div>
            <p className="text-xs text-[#2a2a2e]">
              <strong className="text-[#0f0f10]">Interactive &gt; Constructive &gt; Active &gt; Passive.</strong> Passive podcast listening yields minimal neural retention. elenchus.ai elevates thought to the highest tier—forcing the learner to co-construct meaning and resolve misconceptions in real-time dialogic sparring.
            </p>
          </div>

          {/* 2. Generation Effect & Retrieval Practice */}
          <div className="p-4 bg-white/70 border border-[#0f0f10]/10 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10] font-semibold">
              <Zap className="w-4 h-4 text-[#d95d39]" />
              <span>2. The Generation Effect &amp; Spontaneous Retrieval</span>
            </div>
            <p className="text-xs text-[#2a2a2e]">
              Information is chemically consolidated when generated from one&apos;s own mind (Slamecka &amp; Graf, 1978). Under conversational challenge, answering spontaneous counterarguments acts as high-leverage retrieval practice (Roediger &amp; Karpicke, 2006).
            </p>
          </div>

          {/* 3. The Protégé Effect */}
          <div className="p-4 bg-white/70 border border-[#0f0f10]/10 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10] font-semibold">
              <BookOpen className="w-4 h-4 text-[#d95d39]" />
              <span>3. The Protégé Effect (Dialogic Elaboration)</span>
            </div>
            <p className="text-xs text-[#2a2a2e]">
              Formulating an idea verbally forces fragmented, implicit intuitions into explicit, coherent prose. Talking out loud triggers natural teaching mode, restructuring logic with greater cognitive fidelity.
            </p>
          </div>

          {/* 4. Attention & Adaptive Pacing */}
          <div className="p-4 bg-white/70 border border-[#0f0f10]/10 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10] font-semibold">
              <Sparkles className="w-4 h-4 text-[#d95d39]" />
              <span>4. Anti-Mind-Wandering &amp; Socratic Probing</span>
            </div>
            <p className="text-xs text-[#2a2a2e]">
              Audio monologues suffer from high mind-wandering. elenchus.ai introduces structured cognitive resets through continuous conversational volleys, probing comprehension and setting dialectical traps before complex models collapse.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#0f0f10]/10 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-[#0f0f10]/60">
          <span>( Socratic Invariance · Peer Review Grounded )</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 border border-[#0f0f10] bg-[#0f0f10] text-[#fbfbf9] hover:bg-neutral-800 transition-colors uppercase tracking-wider font-mono text-xs shadow-2xs"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
