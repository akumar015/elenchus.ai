import { Header } from "@/components/layout/Header";
import { DailyDropGrid } from "@/components/topic/DailyDropGrid";
import { CustomSparkBar } from "@/components/topic/CustomSparkBar";
import { ShieldAlert, Zap, Radio, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-elenchus-ground text-elenchus-chalk">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
        {/* Editorial Hero Section */}
        <section className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-elenchus-terracotta/10 border border-elenchus-terracotta/30 text-elenchus-terracotta font-mono text-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>THE SOCRATIC CONVERSATIONAL ENGINE</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-elenchus-chalk tracking-tight leading-[1.08]">
            Cure passive consumption.
            <br />
            <span className="italic font-normal text-elenchus-stone">
              Defend your reasoning out loud.
            </span>
          </h1>

          <p className="text-elenchus-stone text-base sm:text-lg leading-relaxed max-w-2xl">
            Listening to summaries produces an illusion of competence. elenchus.ai
            transforms essays, philosophy, and mental models into a two-way verbal
            sparring ring—detecting lazy clichés and ambiently capturing your spoken
            epiphanies.
          </p>

          {/* Core Ethos Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-lg border border-elenchus-border bg-elenchus-surface-1/50 space-y-1.5">
              <div className="flex items-center gap-2 text-elenchus-terracotta font-mono text-xs uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Zero Monologues</span>
              </div>
              <p className="text-elenchus-stone text-xs leading-relaxed">
                20-second punchy volleys ending in counter-intuitive traps.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-elenchus-border bg-elenchus-surface-1/50 space-y-1.5">
              <div className="flex items-center gap-2 text-elenchus-emerald font-mono text-xs uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5" />
                <span>Voice-First Fluency</span>
              </div>
              <p className="text-elenchus-stone text-xs leading-relaxed">
                Powered by Gnani STT & Timbre TTS with natural Indian accent cadence.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-elenchus-border bg-elenchus-surface-1/50 space-y-1.5">
              <div className="flex items-center gap-2 text-elenchus-amber font-mono text-xs uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Atomic Thought Cards</span>
              </div>
              <p className="text-elenchus-stone text-xs leading-relaxed">
                Every exposed blind spot captured and export-ready for Notion / Obsidian.
              </p>
            </div>
          </div>
        </section>

        {/* Bring Your Own Spark Bar */}
        <CustomSparkBar />

        {/* The Daily Drops Grid */}
        <DailyDropGrid />
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-elenchus-border bg-elenchus-surface-1/40 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-elenchus-muted">
          <div className="flex items-center gap-2">
            <span className="text-elenchus-chalk font-serif font-semibold">
              elenchus.ai
            </span>
            <span>·</span>
            <span>The Socratic Conversational Sparring Engine</span>
          </div>
          <div className="flex items-center gap-4 text-elenchus-stone">
            <span>Gnani AI SDK</span>
            <span>·</span>
            <span>Gemini 3.5 Flash</span>
            <span>·</span>
            <span>Next.js 14 App Router</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
