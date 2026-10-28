"use client";

import Link from "next/link";
import { Topic } from "@/types/topic";
import { useSparStore } from "@/lib/store";
import { ArrowUpRight, Flame, Languages } from "lucide-react";

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  const { language } = useSparStore();

  // Category-specific semantic color mapping
  const getCategoryStyles = (category: string) => {
    switch (category.toLowerCase()) {
      case "philosophy":
        return "bg-elenchus-amber/10 text-elenchus-amber border-elenchus-amber/25";
      case "behavioral economics":
      case "economics":
        return "bg-elenchus-emerald/10 text-emerald-400 border-emerald-500/25";
      case "cognitive science":
      case "psychology":
        return "bg-elenchus-indigo/10 text-indigo-300 border-indigo-500/25";
      case "systems thinking":
      case "political science":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/25";
      default:
        return "bg-elenchus-surface-3 text-elenchus-stone border-elenchus-border";
    }
  };

  return (
    <article className="group relative flex flex-col justify-between rounded-xl border border-elenchus-border bg-elenchus-surface-1 p-6 transition-all duration-300 hover:border-elenchus-terracotta/40 hover:bg-elenchus-surface-2/60">
      {/* Top Header: Category & Language Indicator */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span
          className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryStyles(
            topic.category
          )}`}
        >
          {topic.category}
        </span>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-elenchus-muted bg-elenchus-ground px-2 py-0.5 rounded border border-elenchus-border">
          <Languages className="w-2.5 h-2.5 text-elenchus-stone" />
          <span className={language === "hi-IN" ? "text-elenchus-terracotta font-medium" : "text-elenchus-stone"}>
            {language === "hi-IN" ? "HINGLISH · POORVI" : "EN · KAVERI"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-3 mb-6">
        <h3 className="font-serif text-2xl font-bold tracking-tight text-elenchus-chalk group-hover:text-elenchus-terracotta transition-colors duration-200">
          {topic.title}
        </h3>
        <p className="text-elenchus-stone text-sm leading-relaxed line-clamp-3">
          {topic.summary}
        </p>
      </div>

      {/* The Opening Trap Callout */}
      <div className="rounded-lg border border-elenchus-border/80 bg-elenchus-ground/60 p-3.5 mb-6 space-y-1.5 transition-colors group-hover:border-elenchus-terracotta/25">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-elenchus-terracotta">
          <Flame className="w-3 h-3" />
          <span>Opening Trap</span>
        </div>
        <p className="font-serif italic text-sm text-elenchus-chalk/90 leading-snug">
          &ldquo;{topic.opening_trap}&rdquo;
        </p>
      </div>

      {/* CTA Button */}
      <Link
        href={`/spar/${encodeURIComponent(topic.id)}`}
        className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-lg bg-elenchus-surface-2 border border-elenchus-border font-mono text-xs uppercase tracking-wider text-elenchus-chalk group-hover:bg-elenchus-terracotta group-hover:border-elenchus-terracotta group-hover:text-white transition-all duration-200 active:scale-[0.98]"
      >
        <span>Enter Sparring Arena</span>
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </article>
  );
}
