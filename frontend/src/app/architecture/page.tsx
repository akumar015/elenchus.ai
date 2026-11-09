"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function ArchitecturePage() {
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
              [ architecture specification ]
            </span>
          </div>

          <nav aria-label="Architecture navigation" className="flex items-center gap-3 sm:gap-5 font-mono text-xs">
            <Link
              href="/about"
              className="text-[#0f0f10]/70 hover:text-[#0f0f10] hover:scale-105 transition-all flex items-center gap-1"
            >
              <span>about</span>
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

      {/* 2. Main Technical Architecture Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16 sm:space-y-24">
        {/* Hero Section */}
        <section className="space-y-6 border-b border-[#0f0f10]/10 pb-12 sm:pb-16">
          <div className="font-mono text-[11px] uppercase tracking-widest text-[#b8945c] font-semibold">
            System Design
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0f0f10] leading-[1.08] max-w-4xl">
            How Elenchus actually thinks, speaks, and remembers.
          </h1>

          <p className="font-sans text-base sm:text-lg md:text-xl text-[#0f0f10]/75 max-w-3xl leading-relaxed font-normal">
            A look under the hood: the multi-agent runtime, the bilingual voice pipeline, and the architecture that makes real-time dialectic possible.
          </p>
        </section>

        {/* System Overview & Architectural Topology */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
              System Topology
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
              System overview
            </h2>
          </div>

          <p className="font-sans text-sm sm:text-base text-[#0f0f10]/80 leading-relaxed font-normal">
            Elenchus is built as a decoupled frontend/backend system: a Next.js 14 client handles state, audio orchestration, and the local-first vault, while a FastAPI backend runs the actual debate engines and coordinates two external AI services: Google Gemini for reasoning and Gnani.ai for Indic voice synthesis.
          </p>

          {/* Architectural Diagram Card */}
          <div className="p-6 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] border border-[#0f0f10]/8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#0f0f10]/10 pb-3 font-mono text-[11px] text-[#0f0f10]/50 tracking-wider uppercase">
              <span>Runtime Topology Map</span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Active Bus</span>
              </span>
            </div>

            {/* Visual ASCII / Topology Block */}
            <div className="p-5 sm:p-6 bg-[#0f0f10]/[0.03] rounded-lg font-mono text-xs text-[#0f0f10] overflow-x-auto leading-relaxed border border-[#0f0f10]/5">
              <pre className="text-[11px] sm:text-xs">
{`USER / INTERLOCUTOR
  ↕ voice (Web Speech API) / text rebuttal
FRONTEND : Next.js 14 (App Router)
  routes, Zustand state, audioManager.ts mutex lock, sovereign local vault
  ↕ REST + binary PCM/WAV audio streams
BACKEND : FastAPI / Python 3.11+
  Socratic Engine · Podcast Engine · Scribe Engine · URL Scraper · TTS Client
  ↕                                      ↕
GEMINI 3.5 FLASH LITE           GNANI.AI TIMBRE v3.0
reasoning & dialectic personas    Indic voice synthesis (en-IN / hi-IN)`}
              </pre>
            </div>

            {/* Visual Telemetry Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs text-[#0f0f10]/75">
              <div className="p-3 bg-[#0f0f10]/[0.02] rounded-md space-y-1">
                <span className="text-[10px] uppercase text-[#b8945c] font-semibold block">Client Runtime</span>
                <p className="font-medium text-[#0f0f10]">Next.js 14 + Zustand</p>
                <p className="text-[11px] text-[#0f0f10]/60 font-sans">Zero lag reactive turns &amp; local-first vault.</p>
              </div>
              <div className="p-3 bg-[#0f0f10]/[0.02] rounded-md space-y-1">
                <span className="text-[10px] uppercase text-[#b8945c] font-semibold block">Inference Gateway</span>
                <p className="font-medium text-[#0f0f10]">Gemini 3.5 Flash Lite</p>
                <p className="text-[11px] text-[#0f0f10]/60 font-sans">Multi-agent context routing &amp; aporia logic.</p>
              </div>
              <div className="p-3 bg-[#0f0f10]/[0.02] rounded-md space-y-1">
                <span className="text-[10px] uppercase text-[#b8945c] font-semibold block">Acoustic Pipeline</span>
                <p className="font-medium text-[#0f0f10]">Gnani Timbre v3.0</p>
                <p className="text-[11px] text-[#0f0f10]/60 font-sans">Indic prosody + sequential mutex lock.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pillar 1: The multi-agent dialectic runtime */}
        <section className="space-y-6 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Multi-Agent Dialectic Runtime
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
            The multi-agent dialectic runtime
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#0f0f10]/80 leading-relaxed font-normal">
            Two distinct conversational engines run on Gemini 3.5 Flash Lite, each with its own logic for how AI agents take turns and push the conversation forward.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
            {/* Podcast Engine Card */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ 3-Way Roundtable Dynamic ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Podcast Engine: the 3-way roundtable
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Instead of one assistant, the user sits between two AI co-hosts with opposing jobs:
              </p>

              <div className="space-y-3 font-sans text-xs sm:text-sm text-[#0f0f10]/80">
                <div className="p-3.5 bg-[#0f0f10]/[0.02] rounded-lg border-l-2 border-emerald-600 space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0f0f10]">
                    The Anchor <span className="text-[#0f0f10]/50 font-normal">(Kalpana / Shivani)</span>
                  </div>
                  <p className="text-[12px] text-[#0f0f10]/70">
                    Builds the narrative, synthesizes perspectives, and keeps conversation momentum.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0f0f10]/[0.02] rounded-lg border-l-2 border-[#b8945c] space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0f0f10]">
                    The Provocateur <span className="text-[#0f0f10]/50 font-normal">(Avinash)</span>
                  </div>
                  <p className="text-[12px] text-[#0f0f10]/70">
                    Attacks assumptions, introduces edge cases, and resists easy consensus.
                  </p>
                </div>
              </div>

              <p className="font-sans text-xs text-[#0f0f10]/75 leading-relaxed pt-2">
                The engine routes turns automatically between Anchor, Provocateur, and user: simulating a real studio dynamic rather than a scripted back-and-forth.
              </p>
            </article>

            {/* Socratic Engine Card */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ 1-on-1 Socratic Duel ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Socratic Engine: the 1-on-1 duel
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                A direct cross-examination that advances through a four-stage state machine:
              </p>

              {/* 4-Stage Stepper Visual */}
              <div className="space-y-2 pt-1 font-mono text-xs">
                <div className="p-3 bg-[#0f0f10]/[0.03] rounded-lg flex items-start gap-3">
                  <span className="text-[#b8945c] font-bold">01</span>
                  <div>
                    <span className="font-medium text-[#0f0f10] block">Thesis Exposition</span>
                    <span className="font-sans text-[11px] text-[#0f0f10]/65">State your unexamined conviction.</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0f0f10]/[0.03] rounded-lg flex items-start gap-3">
                  <span className="text-[#b8945c] font-bold">02</span>
                  <div>
                    <span className="font-medium text-[#0f0f10] block">Cross-Examination</span>
                    <span className="font-sans text-[11px] text-[#0f0f10]/65">Edge cases and contradictions surface.</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0f0f10]/[0.03] rounded-lg flex items-start gap-3">
                  <span className="text-[#b8945c] font-bold">03</span>
                  <div>
                    <span className="font-medium text-[#0f0f10] block">Aporia</span>
                    <span className="font-sans text-[11px] text-[#0f0f10]/65">The argument hits genuine intellectual impasse.</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0f0f10]/[0.03] rounded-lg flex items-start gap-3">
                  <span className="text-[#b8945c] font-bold">04</span>
                  <div>
                    <span className="font-medium text-[#0f0f10] block">Synthesis</span>
                    <span className="font-sans text-[11px] text-[#0f0f10]/65">A battle-tested version of the idea is reconstructed.</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Pillar 2: Bilingual Indic voice & concurrency control */}
        <section className="space-y-6 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Bilingual Indic Voice &amp; Concurrency Control
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
            Bilingual Indic voice &amp; concurrency control
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#0f0f10]/80 leading-relaxed font-normal">
            Real debates in India don&rsquo;t stay in one language: they code-switch. The voice pipeline is built around that.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ Authentic Prosody ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Code-switching via Gnani.ai Timbre v3.0
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Each persona has a natural voice in both Indian English and colloquial Hinglish, with real prosody rather than flat TTS.
              </p>
              <div className="pt-2 font-mono text-xs text-[#0f0f10]/60 space-y-1">
                <div>· English Voice Cast: Kalpana &amp; Avinash</div>
                <div>· Hinglish Voice Cast: Shivani &amp; Avinash</div>
              </div>
            </div>

            <div className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ audioManager.ts ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                The audio mutex lock
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                In a 3-way podcast, multiple agents can generate audio in rapid succession: naive playback would overlap or cut off mid-sentence. A custom audio manager (<code className="text-[#b8945c] font-mono text-xs">audioManager.ts</code>) solves this with a strict queue:
              </p>
              <ul className="font-sans text-xs sm:text-sm text-[#0f0f10]/80 space-y-1.5 list-disc list-inside pt-1">
                <li>Audio buffers play in enforced conversational order.</li>
                <li>The next speaker only starts once the current one finishes.</li>
                <li>Visualizer orbs sync their pulse to whoever&rsquo;s actually speaking.</li>
                <li>Browser autoplay blocks are caught automatically with a 1-click resume banner.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pillar 3: Context grounding & Bring Your Own Spark */}
        <section className="space-y-6 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Context Grounding &amp; Bring Your Own Spark
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
            Context grounding &amp; &ldquo;Bring Your Own Spark&rdquo;
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ Grounded Knowledge Base ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                Curated dossiers
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Six core mental models: Survivorship Bias, the Hedonic Treadmill, Dunning-Kruger Effect, Tragedy of the Commons, Opportunity Cost, the Overton Window: each backed by a markdown dossier covering origins, paradoxes, counter-examples, and opening traps the AI uses to start the debate.
              </p>
            </article>

            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ BeautifulSoup4 + Gemini Context ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                On-the-fly ingestion
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Paste an essay, a Substack link, or a raw opinion. The backend strips boilerplate with BeautifulSoup4, isolates the core thesis, formulates counter-arguments, and injects the whole context into Gemini&rsquo;s window: live, in seconds.
              </p>
            </article>
          </div>
        </section>

        {/* Pillar 4: Sovereign archival & Atomic Thought Cards */}
        <section className="space-y-6 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Sovereign Archival &amp; Atomic Thought Cards
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
            Sovereign archival &amp; Atomic Thought Cards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* The Scribe Card */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ scribe.py Synthesis Engine ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                The Scribe
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                At the end of every session, an AI scribe reads the full transcript and distills it into four fields:
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 bg-[#0f0f10]/[0.03] rounded-md">
                  <span className="text-[#b8945c] font-semibold">01 / Core Thesis:</span> the topic&rsquo;s foundational paradox
                </div>
                <div className="p-2.5 bg-[#0f0f10]/[0.03] rounded-md">
                  <span className="text-[#b8945c] font-semibold">02 / Your Stance:</span> the argument you actually made
                </div>
                <div className="p-2.5 bg-[#0f0f10]/[0.03] rounded-md">
                  <span className="text-[#b8945c] font-semibold">03 / Blind Spots:</span> fallacies or trade-offs you missed
                </div>
                <div className="p-2.5 bg-[#0f0f10]/[0.03] rounded-md">
                  <span className="text-[#b8945c] font-semibold">04 / Key Synthesis:</span> the insight that survived the duel
                </div>
              </div>
            </article>

            {/* The Vault Card */}
            <article className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#b8945c] font-medium block">
                [ vaultStorage.ts ]
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0f0f10]">
                The Vault
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                Everything is stored client-side in <code className="text-[#b8945c] font-mono text-xs">localStorage</code>: no accounts, no tracking, no server-held data. Debates are exportable as Markdown (formatted for Obsidian/Notion callouts) or as a full JSON backup. Filterable by modality, searchable in full text.
              </p>

              <div className="p-4 bg-[#0f0f10]/[0.03] rounded-lg font-mono text-[11px] text-[#0f0f10]/70 space-y-1">
                <div>&gt; [!NOTE] 01 / Core Thesis</div>
                <div>&gt; [!QUOTE] 02 / Your Stance</div>
                <div>&gt; [!WARNING] 03 / Blind Spots</div>
                <div>&gt; [!TIP] 04 / Key Synthesis</div>
              </div>
            </article>
          </div>
        </section>

        {/* Design System */}
        <section className="space-y-6 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Design System
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
            Design system
          </h2>

          <div className="p-7 sm:p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] space-y-5">
            <p className="font-sans text-sm sm:text-base text-[#0f0f10]/80 leading-relaxed font-normal">
              A deliberately anti-generic visual language:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
              <div className="p-4 bg-[#0f0f10]/[0.03] rounded-lg space-y-1.5">
                <span className="text-[#b8945c] font-semibold block text-[10px] tracking-wider uppercase">Type</span>
                <p className="font-medium text-[#0f0f10]">Newsreader · Geist · JetBrains</p>
                <p className="text-[11px] text-[#0f0f10]/65 font-sans">
                  Newsreader serif for headlines, Geist Sans for body, JetBrains Mono for technical telemetry.
                </p>
              </div>

              <div className="p-4 bg-[#0f0f10]/[0.03] rounded-lg space-y-1.5">
                <span className="text-[#b8945c] font-semibold block text-[10px] tracking-wider uppercase">Color</span>
                <p className="font-medium text-[#0f0f10]">Warm Paper &amp; Ochre</p>
                <p className="text-[11px] text-[#0f0f10]/65 font-sans">
                  Warm paper (<code className="text-[#b8945c]">#fbfbf9</code>), deep charcoal ink (<code className="text-[#b8945c]">#0f0f10</code>), gold accent (<code className="text-[#b8945c]">#b8945c</code>).
                </p>
              </div>

              <div className="p-4 bg-[#0f0f10]/[0.03] rounded-lg space-y-1.5">
                <span className="text-[#b8945c] font-semibold block text-[10px] tracking-wider uppercase">Motion</span>
                <p className="font-medium text-[#0f0f10]">Fluid Physical Springs</p>
                <p className="text-[11px] text-[#0f0f10]/65 font-sans">
                  Restrained, cubic-bezier transitions, no stock gradients, no AI-slop visual tropes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stack at a glance (Visual Table) */}
        <section className="space-y-6 border-t border-[#0f0f10]/10 pt-12 sm:pt-16">
          <div className="font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            Stack at a glance
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
            Stack at a glance
          </h2>

          <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(15,15,16,0.03)] border border-[#0f0f10]/8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#0f0f10]/10 bg-[#0f0f10]/[0.02] text-[#0f0f10]/60 text-[10px] uppercase tracking-wider">
                    <th className="py-3.5 px-6 font-semibold">Layer</th>
                    <th className="py-3.5 px-6 font-semibold">Technology</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0f0f10]/8 text-[#0f0f10]/85">
                  <tr className="hover:bg-[#0f0f10]/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#b8945c]">Frontend</td>
                    <td className="py-3.5 px-6 font-sans text-xs">Next.js 14, Zustand, Web Speech API</td>
                  </tr>
                  <tr className="hover:bg-[#0f0f10]/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#b8945c]">Backend</td>
                    <td className="py-3.5 px-6 font-sans text-xs">FastAPI, Python 3.11+</td>
                  </tr>
                  <tr className="hover:bg-[#0f0f10]/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#b8945c]">Reasoning</td>
                    <td className="py-3.5 px-6 font-sans text-xs">Google Gemini 3.5 Flash Lite</td>
                  </tr>
                  <tr className="hover:bg-[#0f0f10]/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#b8945c]">Voice</td>
                    <td className="py-3.5 px-6 font-sans text-xs">Gnani.ai Timbre v3.0</td>
                  </tr>
                  <tr className="hover:bg-[#0f0f10]/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#b8945c]">Scraping</td>
                    <td className="py-3.5 px-6 font-sans text-xs">BeautifulSoup4</td>
                  </tr>
                  <tr className="hover:bg-[#0f0f10]/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#b8945c]">Storage</td>
                    <td className="py-3.5 px-6 font-sans text-xs">Client-side (<code className="text-[#b8945c] font-mono text-xs">localStorage</code>), zero server persistence</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-[#0f0f10]/10 pt-16 sm:pt-20 pb-8 text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#0f0f10]">
            Inspect the runtime in live execution.
          </h2>

          <div>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#b8945c] hover:bg-[#a07e4a] text-white font-mono text-xs uppercase tracking-wider font-semibold hover:scale-105 active:scale-[0.98] transition-all duration-300 shadow-xs"
            >
              <span>Launch Studio Hub</span>
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
