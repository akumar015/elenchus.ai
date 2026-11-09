"use client";

import React from "react";
import { Reveal } from "./Reveal";
import { FeatureData } from "./featuresData";
import { MessageSquareQuote } from "lucide-react";

export type { FeatureData } from "./featuresData";

interface FeatureSectionProps {
  feature: FeatureData;
  index: number;
  total: number;
  onInitiateDialogue?: () => void;
}

export function FeatureSection({
  feature,
}: FeatureSectionProps) {
  return (
    <section
      id={feature.id}
      aria-label={feature.title}
      className="relative min-h-screen supports-[height:100svh]:min-h-[100svh] flex flex-col justify-center px-5 sm:px-8 md:px-12 py-24 sm:py-32"
    >
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8 sm:gap-10">
        {/* Category Header & Clean Citation */}
        <div className="space-y-2 border-b border-[#0f0f10]/10 pb-4">
          <Reveal delay={100}>
            <span className="font-mono text-xs uppercase tracking-widest text-[#0f0f10]/60 block">
              {feature.category}
            </span>
          </Reveal>

          <Reveal delay={180}>
            <h2 className="uppercase font-medium tracking-tight text-[#0f0f10] text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.06] drop-shadow-sm">
              {feature.title}
            </h2>
          </Reveal>

          <Reveal delay={240}>
            <p className="font-mono text-xs text-[#0f0f10]/55 tracking-wide">
              {feature.citation}
            </p>
          </Reveal>
        </div>

        {/* Lead Narrative */}
        <Reveal delay={300}>
          <p className="text-base sm:text-lg text-[#0f0f10]/85 leading-relaxed font-normal max-w-3xl">
            {feature.lead}
          </p>
        </Reveal>

        {/* Bespoke Subject-Driven Compositions */}
        {feature.id === "icap-framework" && (
          <Reveal delay={380} className="w-full">
            <div className="space-y-4 pt-2">
              {/* Continuum Track */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-[#0f0f10]/15 space-y-8">
                {/* Level 1: Passive Audio */}
                <div className="space-y-1.5 opacity-60 hover:opacity-85 transition-opacity">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#0f0f10]/70 font-semibold">
                      Passive Audio · 1× Baseline
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#0f0f10]/80 leading-relaxed max-w-2xl">
                    Passive listening to summaries or podcasts produces the illusion of competence. Without friction, the mind assumes it understands what it merely recognized.
                  </p>
                </div>

                {/* Level 2: Interactive Sparring */}
                <div className="space-y-2 relative">
                  <div className="absolute -left-[30px] sm:-left-[38px] top-1.5 w-2.5 h-2.5 bg-[#0f0f10] border-2 border-[#fbfbf9]" />
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#0f0f10] font-semibold">
                      Interactive Sparring
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 border border-[#0f0f10] bg-[#0f0f10] text-[#fbfbf9] tracking-wider font-medium">
                      3× Retention &amp; Transfer
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#0f0f10] leading-relaxed max-w-2xl">
                    Engaging in a spoken dialectic forces you to defend premises, detect blind spots in real time, and co-construct meaning under cognitive friction.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {feature.id === "generation-effect" && (
          <Reveal delay={380} className="w-full">
            <div className="pt-2 space-y-4">
              {/* Dialogue Duel Transcript */}
              <div className="p-5 sm:p-6 bg-white/70 border border-[#0f0f10]/15 shadow-2xs space-y-4 max-w-3xl">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#0f0f10]/60 pb-2 border-b border-[#0f0f10]/10">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-[#b8945c]" />
                  <span>Real-Time Dialectic Pushback</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#0f0f10]/50 pt-0.5 shrink-0 w-16">
                      Thinker
                    </span>
                    <p className="text-[#0f0f10]/80 italic">
                      &ldquo;We should emulate the morning routines of successful founders to replicate their results.&rdquo;
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#0f0f10] font-semibold pt-0.5 shrink-0 w-16">
                      elenchus
                    </span>
                    <p className="text-[#0f0f10] font-medium">
                      &ldquo;Founders who failed had the same routines. How do you distinguish between what caused success and what merely survived with it?&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#0f0f10]/65 font-mono max-w-2xl pt-1">
                Under spontaneous challenge, retrieving evidence acts as an unpredictable testing effect—solidifying synaptic pathways against decay.
              </p>
            </div>
          </Reveal>
        )}

        {feature.id === "protege-effect" && (
          <Reveal delay={380} className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 max-w-3xl">
              {/* Column 1: The Fog */}
              <div className="p-5 border border-[#0f0f10]/10 bg-white/40 space-y-2 opacity-75 hover:opacity-100 transition-opacity">
                <span className="font-mono text-xs uppercase tracking-wider text-[#0f0f10]/60 block font-semibold">
                  Internal Fog · Unspoken
                </span>
                <p className="text-xs sm:text-sm text-[#0f0f10]/80 leading-relaxed">
                  Silent thinking allows logical leaps, unexamined contradictions, and comfortable assumptions to hide in the fog of self-persuasion.
                </p>
              </div>

              {/* Column 2: The Runtime */}
              <div className="p-5 border border-[#0f0f10]/25 bg-white/80 shadow-2xs space-y-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[#0f0f10] block font-semibold">
                  Spoken Dialectic · Runtime
                </span>
                <p className="text-xs sm:text-sm text-[#0f0f10] leading-relaxed">
                  Speaking aloud to an attentive interlocutor activates teaching mode—forcing implicit intuitions into explicit, causal grammar.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {feature.id === "socratic-pacing" && (
          <Reveal delay={380} className="w-full">
            <div className="space-y-4 pt-2 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 45-Min Monologue */}
                <div className="p-5 border border-[#0f0f10]/10 bg-white/40 space-y-2 opacity-70">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0f0f10]/60 block font-semibold">
                    45-Minute Monologue
                  </span>
                  <p className="text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed">
                    The attention cliff: passive listening degrades exponentially after minute 3, drifting into background white noise.
                  </p>
                </div>

                {/* Conversational Volleys */}
                <div className="p-5 border border-[#0f0f10]/25 bg-white/85 shadow-2xs space-y-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#0f0f10] block font-semibold">
                    Conversational Volleys
                  </span>
                  <p className="text-xs sm:text-sm text-[#0f0f10] leading-relaxed">
                    Continuous conversational volleys reset attention, probing comprehension and keeping you actively on the record.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* Bottom Takeaway Statement */}
        <div className="pt-4 border-t border-[#0f0f10]/10">
          <Reveal delay={460}>
            <p className="font-serif italic text-base sm:text-lg text-[#0f0f10]">
              &ldquo;{feature.takeaway}&rdquo;
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
