"use client";

import { useSparStore } from "@/lib/store";
import { SparLanguage } from "@/types/spar";
import { Languages } from "lucide-react";

interface LanguageToggleProps {
  size?: "sm" | "md";
  onLanguageChange?: (lang: SparLanguage) => void;
  className?: string;
  showIcon?: boolean;
}

export function LanguageToggle({
  size = "md",
  onLanguageChange,
  className = "",
  showIcon = false,
}: LanguageToggleProps) {
  const { language, setLanguage } = useSparStore();

  const handleSelect = (lang: SparLanguage) => {
    setLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      role="radiogroup"
      aria-label="Select Dialectic Sparring Language"
      className={`inline-flex items-center rounded-lg border border-elenchus-border bg-elenchus-surface-1 p-0.5 select-none ${className}`}
    >
      {showIcon && (
        <span className="pl-2 pr-1 text-elenchus-muted">
          <Languages className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </span>
      )}
      <button
        type="button"
        role="radio"
        aria-checked={language === "en-IN"}
        onClick={() => handleSelect("en-IN")}
        className={`rounded-md font-mono transition-all duration-150 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          language === "en-IN"
            ? "bg-elenchus-surface-3 text-elenchus-chalk font-semibold shadow-sm border border-elenchus-border-strong"
            : "text-elenchus-muted hover:text-elenchus-stone"
        }`}
        title="Indian English voice (Kaveri)"
      >
        EN
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={language === "hi-IN"}
        onClick={() => handleSelect("hi-IN")}
        className={`rounded-md font-mono transition-all duration-150 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          language === "hi-IN"
            ? "bg-elenchus-terracotta/20 text-elenchus-terracotta font-semibold shadow-sm border border-elenchus-terracotta/40"
            : "text-elenchus-muted hover:text-elenchus-stone"
        }`}
        title="Hinglish bilingual voice (Poorvi)"
      >
        HINGLISH
      </button>
    </div>
  );
}
