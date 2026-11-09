"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSparStore } from "@/lib/store";
import { api } from "@/lib/api";
import { STARTER_TOPICS } from "@/lib/starterTopics";
import { Topic } from "@/types/topic";
import { AuthModal } from "@/components/landing/AuthModal";
import { ThoughtCardVault } from "@/components/vault/ThoughtCardVault";
import { stopAllGlobalAudio } from "@/lib/audioManager";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
  Compass,
  Archive,
} from "lucide-react";

export default function StudioHubPage() {
  const router = useRouter();
  const { user, mode, language, setMode, setLanguage, setCurrentTopic } = useSparStore();

  const [topics, setTopics] = useState<Topic[]>(STARTER_TOPICS);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Bring Your Own Spark custom state
  const [sparkInput, setSparkInput] = useState("");
  const [sparkLoading, setSparkLoading] = useState(false);
  const [sparkError, setSparkError] = useState<string | null>(null);

  // Fetch live daily topics on mount
  useEffect(() => {
    stopAllGlobalAudio();
    let isMounted = true;
    api
      .getDailyTopics()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setTopics(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch daily topics from backend, using starter cache:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingTopics(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    topics.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ["All", ...Array.from(set)];
  }, [topics]);

  // Filter topics by category
  const filteredTopics = useMemo(() => {
    if (selectedCategory === "All") return topics;
    return topics.filter((t) => t.category === selectedCategory);
  }, [topics, selectedCategory]);

  // Launch a session
  const handleLaunchTopic = (topic: Topic) => {
    setCurrentTopic(topic);
    router.push(`/spar/${encodeURIComponent(topic.id)}`);
  };

  // Synthesize custom spark
  const handleSynthesizeSpark = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = sparkInput.trim();
    if (!query || sparkLoading) return;

    setSparkLoading(true);
    setSparkError(null);

    try {
      const isUrl = /^https?:\/\//i.test(query);
      if (isUrl) {
        const res = await api.synthesizeSpark(query);
        const customTopic: Topic = {
          id: res.topic.id,
          title: res.topic.title,
          category: res.topic.category || "Synthesized Dossier",
          summary: res.topic.summary,
          opening_trap: res.topic.opening_trap,
        };
        sessionStorage.setItem(`custom-topic-${customTopic.id}`, JSON.stringify(customTopic));
        setCurrentTopic(customTopic);
        router.push(`/spar/${encodeURIComponent(customTopic.id)}`);
      } else {
        // Direct philosophical premise / question
        const slug = query
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 48);

        const customTopic: Topic = {
          id: slug || `custom-${Date.now()}`,
          title: query.length > 60 ? query.slice(0, 57) + "..." : query,
          category: "User Inscribed Premise",
          summary: query,
          opening_trap: "State your conviction clearly so the hosts can test where your model fractures.",
        };

        sessionStorage.setItem(`custom-topic-${customTopic.id}`, JSON.stringify(customTopic));
        setCurrentTopic(customTopic);
        router.push(`/spar/${encodeURIComponent(customTopic.id)}`);
      }
    } catch (err: unknown) {
      console.error("Spark synthesis error:", err);
      const msg = err instanceof Error ? err.message : "Failed to synthesize custom spark.";
      setSparkError(msg);
    } finally {
      setSparkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#0f0f10] selection:bg-[#0f0f10]/12 selection:text-[#0f0f10] antialiased flex flex-col">
      {/* 1. Studio Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#0f0f10]/10 bg-[#fbfbf9]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Link Back to Manifesto */}
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="font-mono text-lg sm:text-xl font-medium tracking-tight text-[#0f0f10] hover:text-black transition-colors"
            >
              (elenchus.ai)
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#0f0f10]/50 hidden sm:inline-block">
              [ dialectical studio hub ]
            </span>
          </div>

          {/* User Identity & Auth Status */}
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
            <a
              href="#vault"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#0f0f10]/75 hover:text-[#0f0f10] hover:bg-[#0f0f10]/[0.05] hover:scale-105 transition-all duration-300 text-[11px] uppercase tracking-wider rounded-lg"
            >
              <Archive className="w-3.5 h-3.5 text-[#b8945c]" />
              <span className="hidden sm:inline">Thought Vault</span>
              <span className="sm:hidden">Vault</span>
            </a>

            {user ? (
              <div className="flex items-center gap-2 px-2.5 py-1 text-[#0f0f10]">
                {user.picture ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.picture}
                    alt={user.name || "Thinker"}
                    className="w-5 h-5 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 bg-[#b8945c] text-white flex items-center justify-center text-[10px] font-bold rounded-md">
                    {(user.name || user.email || "T").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate max-w-[120px] font-medium text-[#0f0f10]">
                  {user.name || user.email}
                </span>
                <span className="text-[#0f0f10]/20">·</span>
                <button
                  type="button"
                  onClick={() => useSparStore.getState().logout()}
                  className="text-[11px] text-[#0f0f10]/50 hover:text-rose-600 transition-colors"
                >
                  sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-[#0f0f10]/80 hover:text-[#0f0f10] hover:bg-[#0f0f10]/[0.05] hover:scale-105 transition-all duration-300 rounded-lg"
              >
                <span>sign in</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#b8945c]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Studio Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* 2. Welcome Editorial Heading */}
        <section className="space-y-3 border-b border-[#0f0f10]/10 pb-6 sm:pb-8">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#b8945c]">
            <Compass className="w-3.5 h-3.5" />
            <span>Select Modality &amp; Premise</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#0f0f10] leading-[1.08]">
            Welcome, {user?.name ? user.name.split(" ")[0] : "Thinker"}.
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0f0f10]/75 max-w-2xl leading-relaxed">
            Choose between an immersive 3-way roundtable with our AI co-hosts, or enter the 1-on-1 sparring arena for direct Socratic cross-examination under cognitive friction.
          </p>
        </section>

        {/* 3. Sticky Dialectic Control Deck */}
        <section
          aria-label="Dialectic Engine Settings"
          className="sticky top-16 z-30 py-3.5 px-4 sm:px-6 bg-[#fbfbf9]/95 backdrop-blur-md transition-all border-b border-[#0f0f10]/8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            {/* Left: Modality Switcher (Podcast Studio vs. Sparring Arena) */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#0f0f10]/50 block">
                Conversational Format
              </span>
              <div
                role="radiogroup"
                aria-label="Conversational Modality"
                className="relative inline-flex p-1.5 bg-[#0f0f10]/[0.05] rounded-xl w-full sm:w-auto"
              >
                {/* Sliding active color background */}
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#b8945c] rounded-lg shadow-xs transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    mode === "podcast" ? "left-1.5" : "left-[50%]"
                  }`}
                />

                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "podcast"}
                  onClick={() => setMode("podcast")}
                  className={`relative z-10 flex-1 min-w-[150px] sm:min-w-[195px] flex items-center justify-center text-center gap-2 px-3 sm:px-4 py-2 font-mono text-xs rounded-lg transition-colors duration-500 ${
                    mode === "podcast"
                      ? "text-[#fbfbf9] font-medium"
                      : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                  }`}
                >
                  <span>Podcast Studio</span>
                  <span className={`hidden sm:inline-block text-[10px] ${mode === "podcast" ? "text-[#fbfbf9]/75" : "text-[#0f0f10]/40"}`}>
                    [3-Way Roundtable]
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === "spar"}
                  onClick={() => setMode("spar")}
                  className={`relative z-10 flex-1 min-w-[150px] sm:min-w-[195px] flex items-center justify-center text-center gap-2 px-3 sm:px-4 py-2 font-mono text-xs rounded-lg transition-colors duration-500 ${
                    mode === "spar"
                      ? "text-[#fbfbf9] font-medium"
                      : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                  }`}
                >
                  <span>Sparring Arena</span>
                  <span className={`hidden sm:inline-block text-[10px] ${mode === "spar" ? "text-[#fbfbf9]/75" : "text-[#0f0f10]/40"}`}>
                    [1-on-1 Duel]
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Language Switcher */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#0f0f10]/50 block">
                Language
              </span>
              <div
                role="radiogroup"
                aria-label="Language"
                className="relative inline-flex p-1.5 bg-[#0f0f10]/[0.05] rounded-xl w-full sm:w-auto"
              >
                {/* Sliding active color background */}
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(25%-4px)] bg-[#b8945c] rounded-lg shadow-xs transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    language === "en-IN"
                      ? "left-1.5"
                      : language === "hi-IN"
                      ? "left-[calc(25%+1px)]"
                      : language === "pa-IN"
                      ? "left-[calc(50%+1px)]"
                      : "left-[calc(75%+1px)]"
                  }`}
                />

                <button
                  type="button"
                  role="radio"
                  aria-checked={language === "en-IN"}
                  onClick={() => setLanguage("en-IN")}
                  className={`relative z-10 flex-1 min-w-[70px] sm:min-w-[85px] flex items-center justify-center text-center px-3 py-2 font-mono text-xs rounded-lg transition-colors duration-500 ${
                    language === "en-IN"
                      ? "text-[#fbfbf9] font-medium"
                      : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                  }`}
                >
                  <span>English</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={language === "hi-IN"}
                  onClick={() => setLanguage("hi-IN")}
                  className={`relative z-10 flex-1 min-w-[70px] sm:min-w-[85px] flex items-center justify-center text-center px-3 py-2 font-mono text-xs rounded-lg transition-colors duration-500 ${
                    language === "hi-IN"
                      ? "text-[#fbfbf9] font-medium"
                      : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                  }`}
                >
                  <span>Hinglish</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={language === "pa-IN"}
                  onClick={() => setLanguage("pa-IN")}
                  className={`relative z-10 flex-1 min-w-[70px] sm:min-w-[85px] flex items-center justify-center text-center px-3 py-2 font-mono text-xs rounded-lg transition-colors duration-500 ${
                    language === "pa-IN"
                      ? "text-[#fbfbf9] font-medium"
                      : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                  }`}
                >
                  <span>Punjabi</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={language === "te-IN"}
                  onClick={() => setLanguage("te-IN")}
                  className={`relative z-10 flex-1 min-w-[70px] sm:min-w-[85px] flex items-center justify-center text-center px-3 py-2 font-mono text-xs rounded-lg transition-colors duration-500 ${
                    language === "te-IN"
                      ? "text-[#fbfbf9] font-medium"
                      : "text-[#0f0f10]/70 hover:text-[#0f0f10]"
                  }`}
                >
                  <span>Telugu</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Curated Daily Drops Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#0f0f10]/10 pb-4">
            <div className="space-y-1">
              <div className="font-mono text-xs uppercase tracking-widest text-[#0f0f10]/60 font-semibold">
                <span>Curated Inquiries · Daily Drops</span>
              </div>
              <p className="text-xs text-[#0f0f10]/65 font-sans">
                Each topic is grounded in an in-context philosophical dossier with historical paradoxes and edge cases.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 transition-all duration-300 whitespace-nowrap rounded-lg ${
                    selectedCategory === cat
                      ? "bg-[#b8945c] text-white font-medium shadow-xs"
                      : "text-[#0f0f10]/60 hover:text-[#0f0f10] hover:bg-[#0f0f10]/[0.05]"
                  }`}
                >
                  {cat === "All" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            {filteredTopics.map((topic, idx) => (
              <article
                key={topic.id}
                onClick={() => handleLaunchTopic(topic)}
                className="group relative bg-white p-7 sm:p-9 flex flex-col justify-between gap-6 shadow-[0_4px_24px_rgba(15,15,16,0.03)] hover:shadow-[0_20px_48px_rgba(15,15,16,0.08)] transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer rounded-xs"
              >
                <div className="space-y-4">
                  {/* Category & Index Header */}
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#0f0f10]/50 tracking-wider">
                    <span className="uppercase text-[#b8945c] font-medium">
                      [{topic.category}]
                    </span>
                    <span>#DROP_{String(idx + 1).padStart(2, "0")}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#0f0f10] group-hover:text-black transition-colors">
                    {topic.title}
                  </h3>

                  {/* Core Paradox Summary */}
                  <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed font-normal">
                    {topic.summary}
                  </p>

                  {/* Provocative Opening Trap */}
                  <div className="p-4 bg-[#b8945c]/[0.06] rounded-xs space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#b8945c] block font-medium">
                      Dialectic Point of Departure
                    </span>
                    <p className="font-serif italic text-xs sm:text-sm text-[#0f0f10] leading-snug">
                      &ldquo;{topic.opening_trap}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Bottom Card Footer: Cast Dynamics & Enter Button */}
                <div className="pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="font-mono text-[10px] text-[#0f0f10]/60 space-y-0.5">
                    {mode === "podcast" ? (
                      <div>
                        <span className="text-[#0f0f10]/40 uppercase tracking-wider">Cast: </span>
                        <span className="text-[#0f0f10] font-medium">
                          {language === "hi-IN" ? "Shivani" : language === "pa-IN" ? "Tarika" : language === "te-IN" ? "Lakshmi" : "Kalpana"} &amp; Avinash · You
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[#0f0f10]/40 uppercase tracking-wider">Adversary: </span>
                        <span className="text-[#0f0f10] font-medium">elenchus cross-examiner</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-700">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                      <span>Context Dossier Active · Ready</span>
                    </div>
                  </div>

                  <div
                    className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold text-[#0f0f10]/70 group-hover:text-[#0f0f10] transition-colors shrink-0 py-1"
                  >
                    <span>{mode === "podcast" ? "Enter Studio" : "Enter Arena"}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#b8945c] transition-transform duration-200 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {loadingTopics && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center text-[#0f0f10]/50 font-mono text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#b8945c]" />
              <span>Hydrating topic dossiers...</span>
            </div>
          )}
        </section>

        {/* 5. Bring Your Own Spark — Custom Inquiry Bar */}
        <section
          aria-label="Custom Spark Synthesis"
          className="bg-white p-7 sm:p-9 space-y-5 shadow-[0_4px_24px_rgba(15,15,16,0.03)] rounded-xs"
        >
          <div className="space-y-1">
            <div className="font-mono text-xs uppercase tracking-widest text-[#0f0f10]/60 font-semibold">
              <span>Bring Your Own Spark · On-The-Fly Synthesis</span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-[#0f0f10]/75 leading-relaxed max-w-2xl">
              Paste an article, essay, or Substack URL — or state an unexamined conviction. elenchus will extract the underlying thesis, compose counter-intuitive paradoxes, and spin up an active dialectic debate.
            </p>
          </div>

          <form onSubmit={handleSynthesizeSpark} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={sparkInput}
              onChange={(e) => setSparkInput(e.target.value)}
              placeholder="e.g. https://paulgraham.com/lesson.html or 'Can moral agency exist without free will?'"
              disabled={sparkLoading}
              className="flex-1 px-4 py-3 bg-[#0f0f10]/[0.04] rounded-xl text-[#0f0f10] placeholder:text-[#0f0f10]/40 font-sans text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#b8945c] focus:bg-white transition-all shadow-xs disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!sparkInput.trim() || sparkLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#b8945c] hover:bg-[#a07e4a] text-white font-mono text-xs uppercase tracking-wider font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xs disabled:opacity-50 shrink-0"
            >
              {sparkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <span>Synthesize Debate</span>
              )}
            </button>
          </form>

          {sparkError && (
            <p className="font-mono text-xs text-rose-600 tracking-wide">
              {sparkError}
            </p>
          )}

          <div className="flex items-center gap-2 font-mono text-[10px] text-[#0f0f10]/50 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#b8945c]" />
            <span>Dossier extraction synthesized via Gemini 3.5 Flash Lite context window</span>
          </div>
        </section>

        {/* 6. My Thought Cards Vault */}
        <ThoughtCardVault
          userId={user?.email || user?.sub || null}
          userEmail={user?.email || null}
          onSignInRequest={() => setAuthModalOpen(true)}
          onSelectTopic={(topicId) => {
            const match = topics.find((t) => t.id === topicId);
            if (match) {
              handleLaunchTopic(match);
            } else {
              router.push(`/spar/${encodeURIComponent(topicId)}`);
            }
          }}
        />
      </main>

      {/* 6. Footer Note */}
      <footer className="border-t border-[#0f0f10]/10 py-8 px-4 sm:px-6 lg:px-8 text-center font-mono text-xs text-[#0f0f10]/50 space-y-1">
        <p>elenchus.ai — Socratic Voice Companion &amp; Podcast Studio</p>
        <p className="text-[10px] text-[#0f0f10]/40">
          Powered by Google Gemini 3.5 Flash Lite · Gnani Timbre v3.0 &amp; Prisma STT
        </p>
      </footer>

      {/* 7. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
