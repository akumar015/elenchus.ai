"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

type ExtractState = "idle" | "loading" | "error";

export function CustomSparkBar() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ExtractState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || state === "loading") return;

    setState("loading");
    setErrorMsg(null);

    try {
      const res = await api.synthesizeSpark(trimmed);
      const topic = res.topic;

      // Store the custom topic in session storage so the spar page can load it
      // without needing a backend /topics/:id lookup
      sessionStorage.setItem(`custom-topic-${topic.id}`, JSON.stringify(topic));

      // Navigate to the sparring arena — same route pattern as daily drops
      router.push(`/spar/${encodeURIComponent(topic.id)}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not extract article. Try a different URL.";
      setErrorMsg(msg);
      setState("error");
    }
  };

  return (
    <div className="rounded-xl border border-elenchus-border bg-elenchus-surface-1 p-6 sm:p-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-elenchus-terracotta">
            <Link2 className="w-3.5 h-3.5" />
            <span>Bring Your Own Spark</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-elenchus-chalk font-semibold">
            Debate any essay, whitepaper, or article
          </h3>
        </div>
        <p className="text-elenchus-muted font-mono text-xs max-w-xs text-left sm:text-right">
          Zero reading friction. We extract the core thesis and set an opening trap.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (state === "error") {
                setState("idle");
                setErrorMsg(null);
              }
            }}
            placeholder="Paste URL (Substack, Paul Graham essay, Wikipedia, Nature)..."
            disabled={state === "loading"}
            className="w-full px-4 py-3 rounded-lg bg-elenchus-ground border border-elenchus-border text-elenchus-chalk placeholder:text-elenchus-muted font-mono text-xs focus:border-elenchus-terracotta transition-colors disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!url.trim() || state === "loading"}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-elenchus-terracotta hover:bg-elenchus-terracotta-hover text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting...</span>
            </>
          ) : (
            <>
              <span>Ignite Custom Duel</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Error feedback */}
      {state === "error" && errorMsg && (
        <div className="flex items-center gap-2 text-elenchus-crimson font-mono text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading hint */}
      {state === "loading" && (
        <p className="font-mono text-xs text-elenchus-stone animate-pulse">
          Extracting article text and synthesizing your opening trap... (~5-10s)
        </p>
      )}
    </div>
  );
}