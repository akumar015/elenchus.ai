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
      className={`inline-flex items-center border border-[#0f0f10]/20 bg-white/80 p-0.5 select-none shadow-2xs ${className}`}
    >
      {showIcon && (
        <span className="pl-2 pr-1 text-[#0f0f10]/50">
          <Languages className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </span>
      )}
      <button
        type="button"
        role="radio"
        aria-checked={language === "en-IN"}
        onClick={() => handleSelect("en-IN")}
        className={`font-mono transition-colors duration-150 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          language === "en-IN"
            ? "bg-[#0f0f10] text-[#fbfbf9] font-medium"
            : "text-[#0f0f10]/60 hover:text-[#0f0f10] hover:bg-white"
        }`}
        title="Indian English voice (Kalpana / Avinash)"
      >
        EN
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={language === "hi-IN"}
        onClick={() => handleSelect("hi-IN")}
        className={`font-mono transition-colors duration-150 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          language === "hi-IN"
            ? "bg-[#b8945c] text-[#fbfbf9] font-medium"
            : "text-[#0f0f10]/60 hover:text-[#0f0f10] hover:bg-white"
        }`}
        title="Hinglish bilingual voice (Shivani / Avinash)"
      >
        HI
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={language === "pa-IN"}
        onClick={() => handleSelect("pa-IN")}
        className={`font-mono transition-colors duration-150 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          language === "pa-IN"
            ? "bg-[#c47335] text-[#fbfbf9] font-medium"
            : "text-[#0f0f10]/60 hover:text-[#0f0f10] hover:bg-white"
        }`}
        title="Punjabi voice (Tarika / Avinash)"
      >
        PA
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={language === "te-IN"}
        onClick={() => handleSelect("te-IN")}
        className={`font-mono transition-colors duration-150 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        } ${
          language === "te-IN"
            ? "bg-[#3d7a80] text-[#fbfbf9] font-medium"
            : "text-[#0f0f10]/60 hover:text-[#0f0f10] hover:bg-white"
        }`}
        title="Telugu voice (Lakshmi / Avinash)"
      >
        TE
      </button>
    </div>
  );
}
