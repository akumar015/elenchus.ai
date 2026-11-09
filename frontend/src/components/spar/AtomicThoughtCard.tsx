"use client";

import React, { useState } from "react";
import { ThoughtCard, DialecticMode } from "@/types/spar";
import {
  Brain,
  Target,
  AlertTriangle,
  Zap,
  Copy,
  Download,
  Check,
  FileText,
  BookmarkCheck,
} from "lucide-react";

interface AtomicThoughtCardProps {
  card: ThoughtCard;
  topicTitle?: string;
  topicId?: string;
  totalTurns?: number;
  finalStage?: string;
  language?: string;
  mode?: DialecticMode;
  date?: string;
  onSaveToVault?: () => void;
  isSaved?: boolean;
}

const DOSSIER_SECTIONS = [
  {
    key: "core_thesis" as const,
    index: "01",
    label: "Ontological Core Thesis",
    sublabel: "Objective definition of the paradox",
    icon: Brain,
    calloutType: "NOTE",
    borderColor: "border-[#0f0f10]/15",
    accentColor: "text-[#0f0f10]",
    bgColor: "bg-white/80",
  },
  {
    key: "user_stance" as const,
    index: "02",
    label: "Articulated Conviction (Your Stance)",
    sublabel: "Premises and positions maintained in dialogue",
    icon: Target,
    calloutType: "QUOTE",
    borderColor: "border-emerald-700/25",
    accentColor: "text-emerald-800",
    bgColor: "bg-emerald-500/[0.04]",
  },
  {
    key: "blind_spots" as const,
    index: "03",
    label: "Exposed Blind Spots & Fractures",
    sublabel: "Unbacked premises or cognitive inversions revealed",
    icon: AlertTriangle,
    calloutType: "WARNING",
    borderColor: "border-[#b8945c]/35",
    accentColor: "text-[#b8945c]",
    bgColor: "bg-[#b8945c]/[0.05]",
  },
  {
    key: "key_insight" as const,
    index: "04",
    label: "Distilled Intellectual Synthesis",
    sublabel: "The single sharpest axiomatic takeaway",
    icon: Zap,
    calloutType: "TIP",
    borderColor: "border-[#0f0f10]/25",
    accentColor: "text-[#0f0f10]",
    bgColor: "bg-[#0f0f10]/[0.03]",
  },
] as const;

/**
 * Builds Obsidian & Notion pre-formatted Markdown with YAML frontmatter
 * and callout blocks natively supported by both PKM tools.
 */
function buildObsidianNotionMarkdown(
  card: ThoughtCard,
  topicTitle?: string,
  totalTurns?: number,
  finalStage?: string,
  language?: string,
  mode?: DialecticMode,
  dateString?: string,
): string {
  const displayDate = dateString
    ? new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const langLabel =
    language === "hi-IN"
      ? "Hinglish (hi-IN)"
      : language === "pa-IN"
      ? "Punjabi (pa-IN)"
      : language === "te-IN"
      ? "Telugu (te-IN)"
      : "English (en-IN)";
  const modeLabel = mode === "podcast" ? "Podcast Studio Roundtable (3-Way)" : "Socratic Sparring Arena (1-on-1)";
  const title = topicTitle || "Dialectical Synthesis";

  return `---
title: "Atomic Thought Card: ${title}"
source: "elenchus.ai"
type: "thought-card"
modality: "${modeLabel}"
language: "${langLabel}"
date: "${displayDate}"
volleys: ${totalTurns ?? "N/A"}
stage: "${finalStage ?? "SYNTHESIS"}"
tags:
  - elenchus
  - mental-models
  - dialectic
  - post-debate-synthesis
---

# Atomic Thought Card: ${title}

> *Inscribed by **elenchus.ai** — Socratic Voice Companion & Archival Dialectic Engine*

> [!NOTE] 01 / Ontological Core Thesis
> ${card.core_thesis}

> [!QUOTE] 02 / Articulated Conviction (Your Stance)
> ${card.user_stance}

> [!WARNING] 03 / Exposed Blind Spots & Fractures
> ${card.blind_spots}

> [!TIP] 04 / Distilled Intellectual Synthesis
> ${card.key_insight}

---
*Classification: ${modeLabel} · ${totalTurns ?? 0} conversational volleys · ${displayDate}*
`;
}

function buildJSON(
  card: ThoughtCard,
  topicTitle?: string,
  topicId?: string,
  totalTurns?: number,
  finalStage?: string,
  language?: string,
  mode?: DialecticMode,
  dateString?: string,
): string {
  return JSON.stringify(
    {
      source: "elenchus.ai",
      schema: "elenchus.atomic_thought_card.v2",
      archived_at: dateString || new Date().toISOString(),
      specimen: {
        topic_id: topicId ?? null,
        topic_title: topicTitle ?? null,
        modality: mode ?? "podcast",
        total_volleys: totalTurns ?? null,
        final_stage: finalStage ?? null,
        language: language ?? "en-IN",
      },
      synthesis: {
        core_thesis: card.core_thesis,
        user_stance: card.user_stance,
        blind_spots: card.blind_spots,
        key_insight: card.key_insight,
      },
    },
    null,
    2,
  );
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AtomicThoughtCard({
  card,
  topicTitle,
  topicId,
  totalTurns,
  finalStage,
  language,
  mode = "podcast",
  date,
  onSaveToVault,
  isSaved,
}: AtomicThoughtCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "obsidian" | "json">("idle");

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const slug = (topicTitle || topicId || "thought-card")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36);

  const specimenHash = (topicId || slug).toUpperCase().slice(0, 8);

  const handleCopyObsidian = async () => {
    const md = buildObsidianNotionMarkdown(
      card,
      topicTitle,
      totalTurns,
      finalStage,
      language,
      mode,
      date,
    );
    await navigator.clipboard.writeText(md);
    setCopyState("obsidian");
    setTimeout(() => setCopyState("idle"), 2200);
  };

  const handleDownloadMarkdown = () => {
    const md = buildObsidianNotionMarkdown(
      card,
      topicTitle,
      totalTurns,
      finalStage,
      language,
      mode,
      date,
    );
    triggerDownload(md, `elenchus-${slug}.md`, "text/markdown");
  };

  const handleDownloadJSON = () => {
    const json = buildJSON(
      card,
      topicTitle,
      topicId,
      totalTurns,
      finalStage,
      language,
      mode,
      date,
    );
    triggerDownload(json, `elenchus-${slug}.json`, "application/json");
    setCopyState("json");
    setTimeout(() => setCopyState("idle"), 1500);
  };

  return (
    <article
      aria-label="Atomic Thought Card Dossier"
      className="relative bg-[#fefefc] border border-[#0f0f10]/20 p-6 sm:p-8 space-y-6 text-[#0f0f10] shadow-sm antialiased"
    >
      {/* Top Registration Hairline Accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0f0f10]" />

      {/* 1. Archival Index Header */}
      <header className="space-y-3 border-b border-[#0f0f10]/15 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px] tracking-wider text-[#0f0f10]/60 uppercase">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0f0f10] bg-[#0f0f10]/5 px-1.5 py-0.5 border border-[#0f0f10]/15">
              DOSSIER #{specimenHash}
            </span>
            <span className="text-[#0f0f10]/30">/</span>
            <span>SPECIMEN ARCHIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{formattedDate}</span>
            <span className="text-[#0f0f10]/30">·</span>
            <span className="font-medium text-[#b8945c]">
              {mode === "podcast" ? "[ PODCAST ROUNDTABLE ]" : "[ SPARRING DUEL ]"}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#0f0f10]/50 font-medium">
            Inscribed Post-Debate Synthesis
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10] leading-snug">
            &ldquo;{topicTitle || "Dialectical Inquiry"}&rdquo;
          </h2>
        </div>

        {/* Technical Ledger Strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-[#0f0f10]/60 pt-1">
          {totalTurns !== undefined && (
            <span>
              <strong className="text-[#0f0f10] font-medium">{totalTurns}</strong> CONVERSATIONAL VOLLEYS
            </span>
          )}
          {finalStage && (
            <>
              <span className="text-[#0f0f10]/25">|</span>
              <span>
                FINAL CADENCE: <strong className="text-[#0f0f10] font-medium">{finalStage}</strong>
              </span>
            </>
          )}
          <span className="text-[#0f0f10]/25">|</span>
          <span>
            VOICE IDIOM: <strong className="text-[#0f0f10] font-medium">{
              language === "hi-IN" ? "HINGLISH" :
              language === "pa-IN" ? "PUNJABI" :
              language === "te-IN" ? "TELUGU" :
              "ENGLISH"
            }</strong>
          </span>
          {isSaved && (
            <>
              <span className="text-[#0f0f10]/25">|</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <BookmarkCheck className="w-3 h-3" />
                VAULT INSCRIBED
              </span>
            </>
          )}
        </div>
      </header>

      {/* 2. Four Archival Dossier Quadrants */}
      <div className="grid grid-cols-1 gap-3.5">
        {DOSSIER_SECTIONS.map(
          ({ key, index, label, sublabel, icon: Icon, borderColor, accentColor, bgColor }) => (
            <section
              key={key}
              className={`border ${borderColor} ${bgColor} p-4 sm:p-5 space-y-2 transition-colors`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#0f0f10]/40">
                    [{index}]
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${accentColor} shrink-0`} />
                  <h3 className="font-mono text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#0f0f10]">
                    {label}
                  </h3>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#0f0f10]/40 hidden sm:inline-block">
                  {sublabel}
                </span>
              </div>
              <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/85 leading-relaxed pl-5 font-normal">
                {card[key]}
              </p>
            </section>
          ),
        )}
      </div>

      {/* 3. Archival Export & Save Toolbar */}
      <footer className="pt-4 border-t border-[#0f0f10]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-[#0f0f10]/55">
          <span className="text-[10px] uppercase tracking-wider">Archival Actions:</span>
          {copyState === "obsidian" && (
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              Obsidian / Notion MD Copied
            </span>
          )}
          {copyState === "json" && (
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              JSON Exported
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSaveToVault && !isSaved && (
            <button
              type="button"
              onClick={onSaveToVault}
              title="Save to My Thought Cards Vault"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#b8945c] bg-[#b8945c]/10 text-[#0f0f10] hover:bg-[#b8945c] hover:text-[#fbfbf9] transition-all text-[11px] uppercase tracking-wider font-medium shadow-2xs"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Inscribe to Vault</span>
            </button>
          )}

          {/* Copy for Obsidian & Notion (1-Click) */}
          <button
            type="button"
            onClick={handleCopyObsidian}
            title="Copy pre-formatted Markdown with Obsidian/Notion callout blocks and YAML frontmatter"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#0f0f10] bg-[#0f0f10] text-[#fbfbf9] hover:bg-neutral-800 transition-all text-[11px] uppercase tracking-wider font-medium shadow-2xs"
          >
            {copyState === "obsidian" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Obsidian / Notion</span>
              </>
            )}
          </button>

          {/* Download Markdown */}
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            title="Download formatted .md file"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#0f0f10]/20 bg-white hover:border-[#0f0f10] hover:bg-[#0f0f10] hover:text-[#fbfbf9] transition-all text-[11px] uppercase tracking-wider text-[#0f0f10] shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>

          {/* Download JSON */}
          <button
            type="button"
            onClick={handleDownloadJSON}
            title="Download raw structured JSON dossier"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#0f0f10]/20 bg-white hover:border-[#0f0f10] hover:bg-[#0f0f10] hover:text-[#fbfbf9] transition-all text-[11px] uppercase tracking-wider text-[#0f0f10] shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </footer>
    </article>
  );
}
