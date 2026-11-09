"use client";

import React, { useState, useEffect } from "react";
import { Reveal } from "./Reveal";
import { Share2, ArrowDown, Check } from "lucide-react";
import { useSparStore } from "@/lib/store";

interface SectionOneProps {
  onInitiateDialogue: () => void;
  onScrollToNext: () => void;
}

export function SectionOne({
  onInitiateDialogue,
  onScrollToNext,
}: SectionOneProps) {
  const storeUser = useSparStore((state) => state.user);
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [ctaFeedback, setCtaFeedback] = useState(false);

  useEffect(() => {
    if (storeUser) {
      setCurrentUser(storeUser);
      return;
    }
    try {
      const stored = localStorage.getItem("elenchus_auth_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch {
      // ignore
    }
  }, [storeUser]);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "elenchus.ai — Dialectical Voice Companion",
          text: "Give Voice to unspoken thought // Resonance In Dialogue",
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or unsupported, fallback to clipboard
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
    onInitiateDialogue();
  };

  return (
    <section
      aria-label="Hero: Give Voice in Dialogue"
      className="relative min-h-screen supports-[height:100svh]:min-h-[100svh] flex flex-col justify-end"
    >
      {/* Content Row */}
      <div className="relative flex flex-col gap-10 px-5 pb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:px-8 md:px-12 md:pb-20">
        {/* Left Heading: Varied Typography (Bold & Normal Contrast) */}
        <h1 className="max-w-xl uppercase text-[#0f0f10] tracking-tight leading-[1.05] drop-shadow-sm text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
          <Reveal delay={100} as="span" className="block pl-6 sm:pl-12 font-semibold">
            Give Voice
          </Reveal>
          <Reveal delay={220} as="span" className="block font-normal text-[#0f0f10]/80">
            to unspoken thought
          </Reveal>
          <Reveal delay={340} as="span" className="block pl-10 sm:pl-20 font-semibold">
            Resonance
          </Reveal>
          <Reveal delay={460} as="span" className="block pl-16 sm:pl-32 font-normal text-[#0f0f10]/80">
            In Dialogue
          </Reveal>
        </h1>

        {/* Right Column: Statement & Core CTA */}
        <div className="w-full max-w-xs flex flex-col items-start">
          {/* Value Proposition Statement */}
          <Reveal delay={400} className="w-full">
            <p className="text-sm leading-relaxed text-[#0f0f10]/85 drop-shadow-sm mb-6 sm:mb-8 font-normal">
              elenchus.ai turns scattered thoughts into structured clarity. Speak
              freely, test your premises, and hear your ideas take shape.
            </p>
          </Reveal>

          {/* Main Action Block */}
          <Reveal delay={520} className="w-full">
            <button
              id="hero-cta"
              onClick={handleCtaClick}
              className={`px-1 py-2 font-mono text-xs sm:text-sm uppercase tracking-wider text-[#0f0f10] bg-transparent flex items-center gap-3 group transition-all duration-300 ease-out opacity-85 hover:opacity-100 transform hover:scale-105 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f0f10] ${
                ctaFeedback ? "opacity-100 text-[#b8945c]" : ""
              }`}
            >
              <span className="font-medium tracking-widest">{ctaFeedback ? "Connecting..." : currentUser ? "Enter Studio" : "Try Demo"}</span>
              <span className="font-mono text-sm text-[#b8945c] transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </button>
          </Reveal>
        </div>
      </div>

      {/* Bottom Controls: Share & Scroll Indicator */}
      <div className="fixed bottom-5 left-5 sm:bottom-6 sm:left-8 md:left-12 z-40">
        <button
          onClick={handleShare}
          aria-label="Share elenchus.ai"
          className="relative group p-2 bg-transparent text-[#0f0f10] opacity-65 hover:opacity-100 transform hover:scale-115 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f0f10]"
        >
          {copied ? (
            <Check className="w-[20px] h-[20px] text-emerald-600 transition-transform duration-300 scale-110" />
          ) : (
            <Share2 className="w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110" />
          )}

          {copied && (
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-wider bg-[#0f0f10] text-white px-2 py-0.5 rounded-xs shadow-sm">
              Copied
            </span>
          )}
        </button>
      </div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6 md:bottom-7 z-40">
        <button
          onClick={onScrollToNext}
          aria-label="Scroll to next statement"
          className="p-2 text-[#0f0f10]/75 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f0f10]"
        >
          <ArrowDown className="w-[18px] h-[18px] motion-safe:animate-bounce" />
        </button>
      </div>
    </section>
  );
}
