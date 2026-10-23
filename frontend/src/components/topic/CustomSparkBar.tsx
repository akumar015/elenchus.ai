"use client";

import { useState } from "react";
import { Link2, ArrowRight } from "lucide-react";

export function CustomSparkBar() {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    // For now in Phase 3, inform user this initiates URL scraper (Phase 5)
    alert(`Article scraping for "${url}" is slated for Phase 5. Select a Daily Drop to spar now!`);
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
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL (Substack, Paul Graham essay, Wikipedia, Nature)..."
            className="w-full px-4 py-3 rounded-lg bg-elenchus-ground border border-elenchus-border text-elenchus-chalk placeholder:text-elenchus-muted font-mono text-xs focus:border-elenchus-terracotta transition-colors"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-elenchus-terracotta hover:bg-elenchus-terracotta-hover text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 active:scale-[0.98]"
        >
          <span>Ignite Custom Duel</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
