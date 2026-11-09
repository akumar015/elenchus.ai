"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#0f0f10] selection:bg-[#0f0f10]/12 selection:text-[#0f0f10] antialiased flex flex-col font-sans">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#0f0f10]/10 bg-[#fbfbf9]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="font-mono text-lg sm:text-xl font-medium tracking-tight text-[#0f0f10] hover:text-black transition-colors"
            >
              (elenchus.ai)
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#0f0f10]/50 hidden sm:inline-block">
              [ manifesto &amp; philosophy ]
            </span>
          </div>

          <nav aria-label="About navigation" className="flex items-center gap-3 sm:gap-5 font-mono text-xs">
            <Link
              href="/architecture"
              className="text-[#0f0f10]/70 hover:text-[#0f0f10] hover:scale-105 transition-all flex items-center gap-1"
            >
              <span>architecture</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#b8945c]" />
            </Link>

            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#b8945c] text-white hover:bg-[#a07e4a] hover:scale-105 transition-all duration-300 font-mono text-[11px] uppercase tracking-wider font-medium shadow-xs"
            >
              <span>Enter Studio</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </nav>
        </div>
      </header>

      {/* 2. Main Narrative Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16 sm:space-y-24">
        {/* Hero Section */}
        <section className="space-y-6 border-b border-[#0f0f10]/10 pb-12 sm:pb-16">
          <div className="font-mono text-[11px] uppercase tracking-widest text-[#b8945c] font-semibold">
            The Core Conviction
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0f0f10] leading-[1.08] max-w-4xl">
            We think the best way to actually understand an idea is to argue about it.
          </h1>

          <p className="font-sans text-base sm:text-lg md:text-xl text-[#0f0f10]/75 max-w-3xl leading-relaxed font-normal">
            elenchus.ai turns dense topics: cognitive science, behavioral economics, political philosophy, into daily conversations you have, not articles you skim.
          </p>
        </section>

        {/* Section 1: Why we exist */}
        <section className="space-y-8">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Why We Exist
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start">
            <div className="md:col-span-4 font-serif text-2xl font-medium text-[#0f0f10] leading-snug">
              Passive consumption is cognitive erosion.
            </div>

            <div className="md:col-span-8 space-y-5 text-sm sm:text-base text-[#0f0f10]/80 leading-relaxed font-sans">
              <p>
                Most &ldquo;learn something new&rdquo; content asks you to passively consume. You read a thread on the Dunning-Kruger effect, nod, and forget it by dinner.
              </p>
              <p className="p-5 bg-white border-l-2 border-[#b8945c] shadow-2xs font-serif italic text-base sm:text-lg text-[#0f0f10] leading-snug">
                &ldquo;We built this on a different bet: you don&rsquo;t really own an idea until you&rsquo;ve defended it, had it challenged, and watched it survive, or fall apart.&rdquo;
              </p>
              <p className="font-medium text-[#0f0f10]">
                So instead of another feed to scroll, we built an arena to enter.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How it feels to use */}
        <section className="space-y-8 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
              The Dialectic Loop
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
              How it feels to use
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Step 1 */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] hover:shadow-[0_12px_36px_rgba(15,15,16,0.06)] transition-all duration-300 space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ 01 · Curated Mental Models ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Pick today&rsquo;s drop.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                A rotating set of mental models: Survivorship Bias, the Hedonic Treadmill, Tragedy of the Commons, Opportunity Cost, the Overton Window, and more, each grounded in a real dossier, not a Wikipedia summary.
              </p>
            </article>

            {/* Step 2 */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] hover:shadow-[0_12px_36px_rgba(15,15,16,0.06)] transition-all duration-300 space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ 02 · Dual Modality Choice ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Choose how you want to think.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Settle into a three-way conversation with two AI co-hosts (one building the narrative, one trying to break it), or step into a 1-on-1 Socratic duel that pushes through cross-examination to an actual impasse.
              </p>
            </article>

            {/* Step 3 */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] hover:shadow-[0_12px_36px_rgba(15,15,16,0.06)] transition-all duration-300 space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ 03 · On-The-Fly Synthesis ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Or bring your own.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Paste an essay, a Substack link, or a half-formed opinion you&rsquo;ve never questioned. We&rsquo;ll find the thesis, surface the counter-arguments, and spin up a debate around it in seconds.
              </p>
            </article>

            {/* Step 4 */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] hover:shadow-[0_12px_36px_rgba(15,15,16,0.06)] transition-all duration-300 space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ 04 · Sovereign Archival ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Leave with something.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Every session ends in an Atomic Thought Card with your stance, your blind spots, and the synthesis, saved to your own vault, searchable, exportable, yours.
              </p>
            </article>
          </div>
        </section>

        {/* Section 3: Built for how people actually argue */}
        <section className="space-y-6 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Built For How People Actually Argue
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#0f0f10]">
            Built for how people actually argue
          </h2>

          <div className="p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-4">
            <p className="font-sans text-sm sm:text-base text-[#0f0f10]/80 leading-relaxed font-normal max-w-3xl">
              Switch fluidly between English and Hinglish mid-conversation, the way real intellectual arguments actually happen in most Indian households and group chats. This isn&rsquo;t translated content. It&rsquo;s built bilingual from the ground up.
            </p>

            <div className="pt-4 border-t border-[#0f0f10]/10 flex flex-wrap items-center gap-4 sm:gap-8 font-mono text-xs text-[#0f0f10]/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>English: Kalpana (Anchor) &amp; Avinash (Provocateur)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b8945c]" />
                <span>Hinglish: Shivani (Anchor) &amp; Avinash (Provocateur)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-[#0f0f10]/10 pt-16 sm:pt-20 pb-8 text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#0f0f10]">
            Stop reading about ideas. Start arguing with them.
          </h2>

          <div>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#b8945c] hover:bg-[#a07e4a] text-white font-mono text-xs uppercase tracking-wider font-semibold hover:scale-105 active:scale-[0.98] transition-all duration-300 shadow-xs"
            >
              <span>Enter the Arena</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0f0f10]/10 py-8 px-4 sm:px-6 lg:px-8 text-center font-mono text-xs text-[#0f0f10]/50 space-y-1">
        <p>elenchus.ai · Socratic Voice Companion &amp; Podcast Studio</p>
        <p className="text-[10px] text-[#0f0f10]/40">
          Powered by Google Gemini 3.5 Flash Lite · Gnani Timbre v3.0 &amp; Prisma STT
        </p>
      </footer>
    </div>
  );
}
