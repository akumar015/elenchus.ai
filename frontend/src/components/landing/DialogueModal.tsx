"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mic, ArrowRight, ShieldCheck } from "lucide-react";

interface DialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREQUENCIES = [
  {
    id: "survivorship-bias",
    title: "Survivorship Bias",
    trap: "Why copying a billionaire's morning routine is statistically meaningless.",
    category: "Cognitive Fallacy",
  },
  {
    id: "hedonic-treadmill",
    title: "Hedonic Treadmill",
    trap: "Is lasting satisfaction an evolutionary impossibility?",
    category: "Philosophy of Mind",
  },
  {
    id: "chestertons-fence",
    title: "Chesterton's Fence",
    trap: "Before tearing down a system, you must prove why it was erected.",
    category: "Systems Thinking",
  },
];

export function DialogueModal({ isOpen, onClose }: DialogueModalProps) {
  const router = useRouter();
  const [customUrl, setCustomUrl] = useState("");

  if (!isOpen) return null;

  const handleSelectTopic = (id: string) => {
    onClose();
    router.push(`/spar/${id}`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onClose();
    router.push(`/spar/survivorship-bias?spark=${encodeURIComponent(customUrl.trim())}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Initiate Socratic Dialogue"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0f0f10]/40 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-[#fbfbf9] border border-[#0f0f10]/15 shadow-2xl p-6 sm:p-8 text-[#0f0f10] space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#0f0f10]/10 pb-4">
          <div className="space-y-1">
            <div className="font-mono text-xs uppercase tracking-widest text-[#0f0f10]/60 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-[#d95d39]" />
              <span>Voice Sparring · Live Connection</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#0f0f10]">
              Select Dialogue Frequency
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

        {/* Premise Frequencies */}
        <div className="space-y-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#0f0f10]/60 block">
            Dialectic Topics (Daily Drops)
          </span>
          <div className="space-y-2">
            {FREQUENCIES.map((freq) => (
              <button
                key={freq.id}
                onClick={() => handleSelectTopic(freq.id)}
                className="w-full text-left p-3.5 border border-[#0f0f10]/10 bg-white/70 hover:bg-[#0f0f10] hover:text-white transition-all group duration-200 flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-wider uppercase opacity-60">
                      {freq.category}
                    </span>
                    <span className="text-xs font-semibold">{freq.title}</span>
                  </div>
                  <p className="text-xs opacity-75 truncate group-hover:opacity-90">
                    {freq.trap}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Bring Your Own Spark URL input */}
        <form onSubmit={handleCustomSubmit} className="space-y-2 pt-2 border-t border-[#0f0f10]/10">
          <label className="font-mono text-[11px] uppercase tracking-wider text-[#0f0f10]/60 block">
            Or Spar with any Article / URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste article, essay, or substack URL..."
              className="flex-1 px-3.5 py-2.5 bg-white border border-[#0f0f10]/15 font-mono text-xs text-[#0f0f10] placeholder:text-[#0f0f10]/40 focus:outline-none focus:ring-2 focus:ring-[#0f0f10] shadow-2xs"
            />
            <button
              type="submit"
              className="px-5 py-2.5 border border-[#0f0f10] bg-[#0f0f10] text-[#fbfbf9] font-mono text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-2xs"
            >
              Ignite
            </button>
          </div>
        </form>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#0f0f10]/55 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local audio streaming · Ephemeral session · Zero data retention</span>
        </div>
      </div>
    </div>
  );
}
