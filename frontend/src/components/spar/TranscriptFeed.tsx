"use client";

import { useEffect, useRef } from "react";
import { Turn } from "@/types/spar";
import { Bot, User, Sparkles } from "lucide-react";

interface TranscriptFeedProps {
  turns: Turn[];
  isThinking?: boolean;
}

export function TranscriptFeed({ turns, isThinking = false }: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isThinking]);

  return (
    <div className="w-full h-full flex flex-col space-y-6 overflow-y-auto pr-2">
      {turns.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-elenchus-border rounded-xl">
          <Sparkles className="w-6 h-6 text-elenchus-terracotta mb-2" />
          <p className="font-serif text-lg text-elenchus-chalk">The Arena is Quiet</p>
          <p className="text-elenchus-stone text-xs font-mono mt-1">
            Setting the opening trap...
          </p>
        </div>
      )}

      {turns.map((turn, index) => {
        const isAI = turn.role === "AI";

        return (
          <div
            key={index}
            className={`flex flex-col gap-2 ${
              isAI ? "items-start" : "items-end"
            }`}
          >
            {/* Header / Role Tag */}
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-elenchus-muted">
              {isAI ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-elenchus-terracotta/20 flex items-center justify-center text-elenchus-terracotta">
                    <Bot className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-elenchus-terracotta font-semibold">
                    ELENCHUS SOCRATIC CORE
                  </span>
                  {turn.stage && <span>· [{turn.stage}]</span>}
                </>
              ) : (
                <>
                  <span className="text-elenchus-stone">YOU (THE CHALLENGER)</span>
                  <div className="w-4 h-4 rounded-full bg-elenchus-surface-3 flex items-center justify-center text-elenchus-stone">
                    <User className="w-2.5 h-2.5" />
                  </div>
                </>
              )}
            </div>

            {/* Turn Content Box */}
            <div
              className={`max-w-2xl rounded-xl p-4 sm:p-5 transition-all ${
                isAI
                  ? "bg-elenchus-surface-1 border border-elenchus-border/80 border-l-2 border-l-elenchus-terracotta text-elenchus-chalk"
                  : "bg-elenchus-surface-2 border border-elenchus-border text-elenchus-chalk"
              }`}
            >
              {isAI ? (
                <p className="font-serif text-base sm:text-lg leading-relaxed italic">
                  &ldquo;{turn.text}&rdquo;
                </p>
              ) : (
                <p className="font-sans text-sm sm:text-base leading-relaxed text-elenchus-chalk">
                  {turn.text}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-elenchus-amber">
            <div className="w-4 h-4 rounded-full bg-elenchus-amber/20 flex items-center justify-center text-elenchus-amber">
              <Bot className="w-2.5 h-2.5 animate-spin" />
            </div>
            <span>ANALYZING YOUR ARGUMENT & FINDING FALLACIES...</span>
          </div>
          <div className="rounded-xl p-4 bg-elenchus-surface-1 border border-elenchus-amber/30 text-elenchus-stone flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-elenchus-amber animate-pulse" />
            <span className="font-mono text-xs italic">
              Preparing dialectic pushback...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
