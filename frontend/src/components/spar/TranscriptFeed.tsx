"use client";

import { useEffect, useRef } from "react";
import { DialecticMode, Turn } from "@/types/spar";
import { Compass, User, Sparkles, Radio, Swords } from "lucide-react";

interface TranscriptFeedProps {
  turns: Turn[];
  isThinking?: boolean;
  mode?: DialecticMode;
}

export function TranscriptFeed({
  turns,
  isThinking = false,
  mode = "podcast",
}: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isThinking]);

  return (
    <div className="w-full h-full flex flex-col space-y-6 overflow-y-auto pr-2">
      {turns.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#0f0f10]/15 bg-white/40 shadow-2xs">
          <Sparkles className="w-6 h-6 text-[#b8945c] mb-2" />
          <p className="font-serif text-xl font-medium text-[#0f0f10]">
            {mode === "podcast" ? "The Studio Desk is Ready" : "The Arena is Quiet"}
          </p>
          <p className="text-[#0f0f10]/60 text-xs font-mono mt-1">
            {mode === "podcast"
              ? "Connecting with the co-hosts for the opening exchange..."
              : "Setting the opening dialectic premise..."}
          </p>
        </div>
      )}

      {turns.map((turn, index) => {
        const isUser = turn.role === "USER";
        const isHost1 = turn.role === "HOST1";
        const isHost2 = turn.role === "HOST2";
        const isAi = turn.role === "AI";

        // Display labels
        const speakerLabel =
          turn.speakerName ||
          (isHost1 ? "Kalpana · Anchor" : isHost2 ? "Avinash · Provocateur" : isAi ? "Elenchus Core" : "You");

        return (
          <div
            key={index}
            className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
          >
            {/* Topic Insight Strip (if attached to this beat) */}
            {turn.topic_insight && (
              <div className="max-w-2xl w-full p-2.5 border border-[#b8945c]/35 bg-[#b8945c]/8 font-mono text-[11px] text-[#0f0f10] flex items-center gap-2 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#b8945c] shrink-0" />
                <span className="font-semibold uppercase tracking-wider text-[#b8945c]">
                  [ TOPIC INSIGHT ]
                </span>
                <span className="truncate text-[#0f0f10]/85 font-normal">
                  {turn.topic_insight}
                </span>
              </div>
            )}

            {/* Header / Role Tag */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#0f0f10]/60">
              {isHost1 && (
                <>
                  <Radio className="w-3 h-3 text-[#b8945c]" />
                  <span className="text-[#b8945c] font-semibold">
                    {speakerLabel.toUpperCase()}
                  </span>
                  <span className="text-[#0f0f10]/40">· The Anchor</span>
                </>
              )}

              {isHost2 && (
                <>
                  <Swords className="w-3 h-3 text-[#c86446]" />
                  <span className="text-[#c86446] font-semibold">
                    {speakerLabel.toUpperCase()}
                  </span>
                  <span className="text-[#0f0f10]/40">· The Provocateur</span>
                </>
              )}

              {isAi && (
                <>
                  <Compass className="w-3 h-3 text-[#b8945c]" />
                  <span className="text-[#b8945c] font-semibold">
                    ELENCHUS SOCRATIC CORE
                  </span>
                  {turn.stage && <span className="text-[#0f0f10]/40">· {turn.stage}</span>}
                </>
              )}

              {isUser && (
                <>
                  <span className="text-[#0f0f10]/70 font-semibold">
                    {mode === "podcast" ? "YOU · GUEST ARBITER" : "YOU · THE CHALLENGER"}
                  </span>
                  <User className="w-3 h-3 text-[#0f0f10]/50" />
                </>
              )}
            </div>

            {/* Turn Content Box */}
            <div
              className={`max-w-2xl p-5 transition-all shadow-2xs ${
                isHost1
                  ? "bg-white/95 border border-[#0f0f10]/12 border-l-2 border-l-[#b8945c] text-[#0f0f10]"
                  : isHost2
                  ? "bg-white/95 border border-[#0f0f10]/12 border-l-2 border-l-[#c86446] text-[#0f0f10]"
                  : isAi
                  ? "bg-white/95 border border-[#0f0f10]/12 border-l-2 border-l-[#b8945c] text-[#0f0f10]"
                  : "bg-white border border-[#0f0f10]/15 text-[#0f0f10]"
              }`}
            >
              {isUser ? (
                <p className="font-sans text-sm sm:text-base leading-relaxed text-[#0f0f10]">
                  {turn.text}
                </p>
              ) : (
                <p className="font-serif text-base sm:text-lg leading-relaxed italic text-[#0f0f10]">
                  &ldquo;{turn.text}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#b8945c]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b8945c] animate-pulse" />
            <span>
              {mode === "podcast"
                ? "CO-HOSTS FORMULATING NEXT DIALECTIC BEAT"
                : "ANALYZING PREMISE & STRUCTURING ADVERSARIAL PUSHBACK"}
            </span>
          </div>
          <div className="p-4 bg-white/90 border border-[#b8945c]/30 text-[#0f0f10]/75 flex items-center gap-2 shadow-2xs font-mono text-xs italic">
            <span className="w-1.5 h-1.5 bg-[#b8945c] animate-pulse" />
            <span>
              {mode === "podcast"
                ? "Synthesizing roundtable clash..."
                : "Formulating dialectic friction..."}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
