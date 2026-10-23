"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSparStore } from "@/lib/store";
import { api } from "@/lib/api";
import { SparLanguage } from "@/types/spar";

export function Header() {
  const { language, setLanguage } = useSparStore();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .health()
      .then(() => {
        if (isMounted) setBackendOnline(true);
      })
      .catch(() => {
        if (isMounted) setBackendOnline(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLanguageToggle = (lang: SparLanguage) => {
    setLanguage(lang);
  };

  return (
    <header className="w-full border-b border-elenchus-border bg-elenchus-ground/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-baseline gap-2.5 transition-opacity hover:opacity-90"
        >
          <span className="font-serif text-2xl tracking-tight text-elenchus-chalk font-semibold">
            elenchus<span className="text-elenchus-terracotta">.ai</span>
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-elenchus-muted hidden sm:inline-block">
            ἔλεγχος · Socratic Sparring
          </span>
        </Link>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Backend Status Pill */}
          <div
            className="flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 rounded-full border border-elenchus-border bg-elenchus-surface-1"
            title={
              backendOnline === null
                ? "Checking engine..."
                : backendOnline
                ? "FastAPI & Socratic Engine Online"
                : "Engine offline — local cache active"
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendOnline === null
                  ? "bg-elenchus-amber animate-pulse"
                  : backendOnline
                  ? "bg-elenchus-emerald animate-pulse"
                  : "bg-elenchus-muted"
              }`}
            />
            <span className="text-elenchus-stone hidden md:inline">
              {backendOnline === null
                ? "CONNECTING"
                : backendOnline
                ? "ENGINE ONLINE"
                : "LOCAL MODE"}
            </span>
          </div>

          {/* Language Code-Switch Toggle (Prepares Phase 5) */}
          <div className="flex items-center rounded-lg border border-elenchus-border bg-elenchus-surface-1 p-0.5">
            <button
              onClick={() => handleLanguageToggle("en-IN")}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                language === "en-IN"
                  ? "bg-elenchus-surface-3 text-elenchus-chalk font-medium shadow-sm"
                  : "text-elenchus-muted hover:text-elenchus-stone"
              }`}
              title="English (India)"
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageToggle("hi-IN")}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                language === "hi-IN"
                  ? "bg-elenchus-terracotta/20 text-elenchus-terracotta font-medium shadow-sm border border-elenchus-terracotta/30"
                  : "text-elenchus-muted hover:text-elenchus-stone"
              }`}
              title="Hinglish (Code-switching mode)"
            >
              HINGLISH
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
