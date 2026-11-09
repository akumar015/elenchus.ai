"use client";

import React, { useState } from "react";
import { Reveal } from "./Reveal";
import { Share2, Check } from "lucide-react";

interface SectionTwoProps {
  onStartVoiceSession: () => void;
}

export function SectionTwo({ onStartVoiceSession }: SectionTwoProps) {
  const [copied, setCopied] = useState(false);
  const [ctaFeedback, setCtaFeedback] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "elenchus.ai — Dialectical Voice Companion",
          text: "Hear what clarifies Precisely.",
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleCtaClick = () => {
    setCtaFeedback(true);
    setTimeout(() => setCtaFeedback(false), 600);
    onStartVoiceSession();
  };

  return (
    <section
      aria-label="Second Statement: Hear What Clarifies"
      className="relative min-h-screen supports-[height:100svh]:min-h-[100svh] flex flex-col justify-between"
    >
      {/* Middle Row: Statement and Metadata */}
      <div className="relative flex-1 flex flex-col items-start justify-center gap-10 px-5 pt-24 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:pt-0 md:px-12">
        {/* Left Heading */}
        <h2 className="max-w-sm sm:max-w-md uppercase text-[#0f0f10] font-medium tracking-tight leading-[1.05] drop-shadow-sm text-4xl sm:text-5xl md:text-6xl">
          <Reveal delay={100} as="span" className="block">
            Hear what clarifies
          </Reveal>
          <Reveal delay={220} as="span" className="block">
            Precisely.
          </Reveal>
        </h2>
      </div>

      {/* Bottom Block: Paragraph & Absolute CTA Pill */}
      <div className="relative flex flex-col gap-10 px-5 sm:px-8 md:px-12 pb-16 md:pb-20">
        <Reveal delay={460} className="max-w-xs">
          <p className="text-sm leading-relaxed text-[#0f0f10]/85 drop-shadow-sm font-normal">
            An elenchus session is dialled to your frequency: a spoken query, an
            explored assumption, an unburdened mind. Cut through internal noise.
          </p>
        </Reveal>

        {/* Center Absolute / Mobile In-Flow Action Block */}
        <Reveal
          delay={580}
          className="w-full sm:w-auto sm:absolute sm:bottom-16 sm:left-1/2 sm:-translate-x-1/2 md:bottom-20 z-30"
        >
          <button
            onClick={handleCtaClick}
            className={`w-full sm:w-auto px-2 py-2 font-mono text-xs sm:text-sm uppercase tracking-wider bg-transparent text-[#0f0f10] opacity-85 hover:opacity-100 transform hover:scale-105 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f0f10] active:scale-[0.98] flex items-center justify-center gap-3 group ${
              ctaFeedback ? "opacity-100 text-[#b8945c]" : ""
            }`}
          >
            <span className="font-medium tracking-widest">{ctaFeedback ? "Initiating Session..." : "Start Voice Session"}</span>
            <span className="font-mono text-sm text-[#b8945c] transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </button>
        </Reveal>

        {/* Bottom Left Share Control (Reveal 700ms) */}
        <Reveal
          delay={700}
          className="sm:hidden" /* Shown in-flow on mobile, desktop is covered by global fixed share button */
        >
          <button
            onClick={handleShare}
            aria-label="Share elenchus.ai"
            className="inline-flex items-center gap-2 font-mono text-xs text-[#0f0f10]/75 hover:text-black transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>{copied ? "URL Copied" : "Share elenchus.ai"}</span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
