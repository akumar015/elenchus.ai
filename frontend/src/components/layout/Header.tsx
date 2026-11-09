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
    <header className="w-full border-b border-[#0f0f10]/10 bg-[#fbfbf9]/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-baseline gap-2.5 transition-opacity hover:opacity-90"
        >
          <span className="font-mono text-xl sm:text-2xl tracking-tight text-[#0f0f10] font-medium">
            (elenchus.ai)
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#0f0f10]/50 hidden sm:inline-block">
            ἔλεγχος · Socratic Sparring
          </span>
        </Link>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Backend Status Badge */}
          <div
            className="flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 border border-[#0f0f10]/15 bg-white/70 shadow-2xs"
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
                  ? "bg-[#b8945c] animate-pulse"
                  : backendOnline
                  ? "bg-emerald-600 animate-pulse"
                  : "bg-neutral-400"
              }`}
            />
            <span className="text-[#0f0f10]/70 hidden md:inline">
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
