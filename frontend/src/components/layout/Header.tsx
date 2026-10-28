"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export function Header() {
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

          {/* Language Code-Switch Toggle */}
          <LanguageToggle showIcon={true} />
        </div>
      </div>
    </header>
  );
}
