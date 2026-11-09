"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SavedThoughtCard } from "@/types/spar";
import {
  getSavedThoughtCards,
  deleteSavedThoughtCard,
} from "@/lib/vaultStorage";
import { STARTER_TOPICS } from "@/lib/starterTopics";
import { AtomicThoughtCard } from "@/components/spar/AtomicThoughtCard";
import {
  Archive,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  Download,
  X,
  Check,
  ArrowUpRight,
} from "lucide-react";

interface ThoughtCardVaultProps {
  userId?: string | null;
  userEmail?: string | null;
  onSelectTopic?: (topicId: string) => void;
  onSignInRequest?: () => void;
}

export function ThoughtCardVault({
  userId,
  userEmail,
  onSelectTopic,
  onSignInRequest,
}: ThoughtCardVaultProps) {
  const [cards, setCards] = useState<SavedThoughtCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<"all" | "podcast" | "spar">("all");
  const [inspectCard, setInspectCard] = useState<SavedThoughtCard | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load from localStorage — strictly scoped to userId
  const refreshCards = React.useCallback(() => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }
    const stored = getSavedThoughtCards(userId);
    setCards(stored);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    // Reset whenever userId changes (login / logout)
    setCards([]);
    setLoading(true);
    refreshCards();

    // Listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (userId && e.key === `elenchus_thought_cards_${userId}`) {
        refreshCards();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userId, refreshCards]);

  // Filtered cards
  const filteredCards = useMemo(() => {
    return cards.filter((item) => {
      // Modality filter
      if (modalityFilter !== "all" && item.mode !== modalityFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.topicTitle.toLowerCase().includes(q);
        const inThesis = item.card.core_thesis.toLowerCase().includes(q);
        const inStance = item.card.user_stance.toLowerCase().includes(q);
        const inInsight = item.card.key_insight.toLowerCase().includes(q);
        const inBlindSpots = item.card.blind_spots.toLowerCase().includes(q);
        return inTitle || inThesis || inStance || inInsight || inBlindSpots;
      }
      return true;
    });
  }, [cards, modalityFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: cards.length,
      podcast: cards.filter((c) => c.mode === "podcast").length,
      spar: cards.filter((c) => c.mode === "spar").length,
    };
  }, [cards]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Archive specimen removal: Remove this Thought Card from your local vault?")) {
      const updated = deleteSavedThoughtCard(id, userId);
      setCards(updated);
      if (inspectCard?.id === id) {
        setInspectCard(null);
      }
    }
  };

  const handleCopyCard = async (item: SavedThoughtCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const md = `---
title: "Atomic Thought Card: ${item.topicTitle}"
source: "elenchus.ai"
modality: "${item.mode}"
date: "${item.date}"
volleys: ${item.totalTurns}
tags: [elenchus, mental-models, thought-card]
---

# Atomic Thought Card: ${item.topicTitle}

> [!NOTE] 01 / Core Thesis
> ${item.card.core_thesis}

> [!QUOTE] 02 / Your Stance
> ${item.card.user_stance}

> [!WARNING] 03 / Blind Spots
> ${item.card.blind_spots}

> [!TIP] 04 / Key Synthesis
> ${item.card.key_insight}
`;
    await navigator.clipboard.writeText(md);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportAllJSON = () => {
    if (cards.length === 0) return;
    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elenchus-thought-cards-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="vault"
      aria-label="My Thought Cards Vault"
      className="space-y-6 pt-4"
    >
      {/* 1. Vault Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#0f0f10]/10 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#b8945c] font-semibold">
            <Archive className="w-3.5 h-3.5" />
            <span>
              ARCHIVAL VAULT
              {userEmail ? ` · ${userEmail}` : ""}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10]">
            My Thought Cards Vault
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 max-w-2xl leading-relaxed">
            {userId
              ? "Every debate generates an archival synthesis. Review your articulated premises, logical blind spots, and distilled axioms preserved in sovereign local storage."
              : "Every debate generates an archival synthesis. Sign in with your Google account to unlock your personal collection."}
          </p>
        </div>

        {userId && cards.length > 0 && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={handleExportAllJSON}
              title="Export complete vault as JSON backup"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0f0f10]/[0.05] hover:bg-[#0f0f10]/[0.1] text-[#0f0f10] hover:scale-105 transition-all duration-300 uppercase tracking-wider text-[11px] font-mono font-medium shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#b8945c]" />
              <span>Export Vault (.JSON)</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Vault Body: Strictly Gated by Authentication */}
      {!userId ? (
        /* Unauthenticated — show clean sign-in gate */
        <div className="border border-[#0f0f10]/15 bg-white/70 p-10 sm:p-14 text-center space-y-5 shadow-2xs">
          <div className="w-12 h-12 mx-auto border border-[#b8945c]/30 flex items-center justify-center text-[#b8945c] bg-[#b8945c]/5">
            <Archive className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#b8945c] block font-semibold">
              [ ACCOUNT-SPECIFIC SOVEREIGN ARCHIVE ]
            </span>
            <p className="font-serif text-xl font-medium text-[#0f0f10]">
              Sign in to view your Thought Cards
            </p>
            <p className="font-sans text-xs text-[#0f0f10]/65 leading-relaxed">
              Every Google account maintains its own private vault of synthesized Thought Cards. Sign in to review your articulated premises, logical blind spots, and distilled axioms.
            </p>
          </div>
          {onSignInRequest && (
            <button
              type="button"
              onClick={onSignInRequest}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#0f0f10] bg-[#0f0f10] text-[#fbfbf9] font-mono text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
            >
              <span>Sign In with Google</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#b8945c]" />
            </button>
          )}
        </div>
      ) : (
        /* Authenticated — show Filter Deck, Search Bar, and Cards */
        <>
          {/* Filter Deck & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Modality Filter Brackets */}
            <div
              role="radiogroup"
              aria-label="Filter by Modality"
              className="relative inline-flex p-1.5 bg-[#0f0f10]/[0.05] rounded-xl self-start w-full sm:w-auto"
            >
              {/* Sliding active color background */}
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc((100%-12px)/3)] bg-[#b8945c] rounded-lg shadow-xs transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  modalityFilter === "all"
                    ? "left-1.5"
                    : modalityFilter === "podcast"
                    ? "left-[calc((100%-12px)/3+6px)]"
                    : "left-[calc((100%-12px)*2/3+6px)]"
                }`}
              />

              <button
                type="button"
                role="radio"
                aria-checked={modalityFilter === "all"}
                onClick={() => setModalityFilter("all")}
                className={`relative z-10 flex-1 min-w-[70px] sm:min-w-[95px] flex items-center justify-center text-center px-3.5 py-1.5 font-mono text-xs rounded-lg transition-colors duration-500 ${
                  modalityFilter === "all"
                    ? "text-[#fbfbf9] font-medium"
                    : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                }`}
              >
                <span>All ({counts.all})</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={modalityFilter === "podcast"}
                onClick={() => setModalityFilter("podcast")}
                className={`relative z-10 flex-1 min-w-[70px] sm:min-w-[95px] flex items-center justify-center text-center px-3.5 py-1.5 font-mono text-xs rounded-lg transition-colors duration-500 ${
                  modalityFilter === "podcast"
                    ? "text-[#fbfbf9] font-medium"
                    : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                }`}
              >
                <span>Podcast ({counts.podcast})</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={modalityFilter === "spar"}
                onClick={() => setModalityFilter("spar")}
                className={`relative z-10 flex-1 min-w-[70px] sm:min-w-[95px] flex items-center justify-center text-center px-3.5 py-1.5 font-mono text-xs rounded-lg transition-colors duration-500 ${
                  modalityFilter === "spar"
                    ? "text-[#fbfbf9] font-medium"
                    : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                }`}
              >
                <span>Sparring ({counts.spar})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-[#0f0f10]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premises or insights..."
                className="w-full pl-9 pr-8 py-2 bg-[#0f0f10]/[0.05] rounded-xl text-[#0f0f10] placeholder:text-[#0f0f10]/40 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#b8945c] focus:bg-white transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#0f0f10]/40 hover:text-[#0f0f10] p-1 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid or Empty State */}
          {loading ? (
            <div className="border border-[#0f0f10]/15 bg-white/50 p-12 text-center font-mono text-xs text-[#0f0f10]/50 space-y-2">
              <p>Accessing local storage archive...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="border border-[#0f0f10]/15 bg-white/70 p-10 sm:p-14 text-center space-y-4 shadow-2xs">
              <div className="w-10 h-10 mx-auto border border-[#0f0f10]/20 flex items-center justify-center text-[#b8945c] bg-[#b8945c]/5">
                <Archive className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#0f0f10]/50 block font-semibold">
                  [ 00 / NO ARCHIVED SPECIMENS FOUND ]
                </span>
                <p className="font-serif text-lg font-medium text-[#0f0f10]">
                  {searchQuery
                    ? `No cards match "${searchQuery}".`
                    : "Your vault is currently empty."}
                </p>
                <p className="font-sans text-xs text-[#0f0f10]/65 leading-relaxed">
                  Complete a dialectical session in the Podcast Studio or 1-on-1 Sparring Arena to inscribe your first permanent mental model synthesis.
                </p>
              </div>
            </div>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCards.map((item) => {
            const formattedDate = new Date(item.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const resolvedCategory = (
              item.category ||
              STARTER_TOPICS.find((t) => t.id === item.topicId)?.category ||
              (item.topicTitle.toLowerCase().includes("survivor") ? "Cognitive Science" : "") ||
              (item.topicTitle.toLowerCase().includes("treadmill") ? "Behavioral Economics" : "") ||
              (item.topicTitle.toLowerCase().includes("dunning") ? "Psychology" : "") ||
              (item.topicTitle.toLowerCase().includes("commons") ? "Economics" : "") ||
              (item.topicTitle.toLowerCase().includes("cost") ? "Economics" : "") ||
              (item.topicTitle.toLowerCase().includes("window") ? "Political Philosophy" : "") ||
              "Cognitive Science"
            ).toUpperCase();

            return (
              <article
                key={item.id}
                onClick={() => setInspectCard(item)}
                className="group relative bg-white p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-[0_4px_20px_rgba(15,15,16,0.03)] hover:shadow-[0_16px_40px_rgba(15,15,16,0.08)] transform hover:-translate-y-1 hover:scale-[1.015] transition-all duration-300 ease-out cursor-pointer rounded-xs"
              >
                {/* Top Ledger Strip */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] tracking-wider">
                    <span className="uppercase text-[#b8945c] font-medium font-mono text-[11px] tracking-wider">
                      [{resolvedCategory}]
                    </span>
                    <span className="uppercase text-[#0f0f10]/40 font-mono text-[10px] tracking-wider">
                      {item.mode === "podcast" ? "PODCAST" : "SPARRING"}
                    </span>
                  </div>

                  {/* Topic Title */}
                  <h3 className="font-serif text-xl font-semibold tracking-tight text-[#0f0f10] group-hover:text-black transition-colors line-clamp-2">
                    &ldquo;{item.topicTitle}&rdquo;
                  </h3>

                  {/* Core Thesis Snippet */}
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#0f0f10]/40 block">
                      Core Thesis
                    </span>
                    <p className="font-sans text-xs text-[#0f0f10]/75 line-clamp-2 leading-relaxed">
                      {item.card.core_thesis}
                    </p>
                  </div>

                  {/* Key Insight Highlight */}
                  <div className="p-3 border-l-2 border-[#b8945c] bg-[#b8945c]/5 space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#b8945c] block font-medium">
                      Key Takeaway
                    </span>
                    <p className="font-serif italic text-xs text-[#0f0f10] line-clamp-2 leading-snug">
                      &ldquo;{item.card.key_insight}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[#0f0f10]/10 flex items-center justify-between font-mono text-[10px] text-[#0f0f10]/60">
                  <span>{formattedDate}</span>

                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Copy Markdown */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyCard(item, e)}
                      title="Copy for Obsidian & Notion"
                      className="p-1.5 rounded-md bg-[#0f0f10]/[0.05] hover:bg-[#0f0f10]/10 text-[#0f0f10] hover:scale-110 transition-all duration-200"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Card */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete card from vault"
                      className="p-1.5 rounded-md bg-[#0f0f10]/[0.05] hover:bg-rose-50 text-[#0f0f10]/60 hover:text-rose-600 hover:scale-110 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Inspect Prompt Button */}
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-[#0f0f10] hover:text-[#b8945c] group-hover:translate-x-0.5 transition-all ml-1">
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3 h-3 text-[#b8945c]" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
          )}
        </>
      )}

      {/* 4. Full Card Inspection Modal */}
      {inspectCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Inspect Atomic Thought Card"
          className="fixed inset-0 z-50 bg-[#0f0f10]/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectCard(null);
          }}
        >
          <div className="max-w-2xl w-full bg-[#fbfbf9] border border-[#0f0f10]/15 shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-[#0f0f10] relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#0f0f10]/10 pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#b8945c] font-semibold block">
                  [ VAULT ARCHIVE · SPECIMEN INSPECTION ]
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#0f0f10]">
                  Archived Synthesis
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectCard(null)}
                aria-label="Close dialog"
                className="p-2 rounded-lg bg-[#0f0f10]/[0.05] hover:bg-[#0f0f10]/10 text-[#0f0f10] hover:scale-105 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded Atomic Thought Card */}
            <AtomicThoughtCard
              card={inspectCard.card}
              topicTitle={inspectCard.topicTitle}
              topicId={inspectCard.topicId}
              totalTurns={inspectCard.totalTurns}
              finalStage={inspectCard.finalStage}
              language={inspectCard.language}
              mode={inspectCard.mode}
              date={inspectCard.date}
              isSaved={true}
            />

            {/* Modal Footer Re-spar CTA */}
            {onSelectTopic && inspectCard.topicId && (
              <div className="pt-3 border-t border-[#0f0f10]/10 flex items-center justify-between font-mono text-xs">
                <span className="text-[#0f0f10]/50 text-[11px]">
                  Want to revisit this premise?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const id = inspectCard.topicId;
                    setInspectCard(null);
                    onSelectTopic(id);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#b8945c] hover:bg-[#a07e4a] text-white hover:scale-105 transition-all duration-300 uppercase tracking-wider text-[11px] font-mono font-medium shadow-xs"
                >
                  <span>Re-enter Topic</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
