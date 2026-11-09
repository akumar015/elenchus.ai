"use client";

import React from "react";
import { ActiveSpeaker, DialecticMode, SparLanguage } from "@/types/spar";
import { Radio, Swords, User } from "lucide-react";

interface StudioHeaderProps {
  mode: DialecticMode;
  language: SparLanguage;
  activeSpeaker: ActiveSpeaker;
  userName?: string;
  topicTitle?: string;
  turnCount: number;
}

export function StudioHeader({
  mode,
  language,
  activeSpeaker,
  userName = "Thinker",
  topicTitle,
  turnCount,
}: StudioHeaderProps) {
  const host1Name =
    language === "hi-IN"
      ? "Shivani"
      : language === "pa-IN"
      ? "Tarika"
      : language === "te-IN"
      ? "Lakshmi"
      : "Kalpana";
  const host1Role =
    language === "hi-IN"
      ? "Hinglish Synthesizer"
      : language === "pa-IN"
      ? "Punjabi Synthesizer"
      : language === "te-IN"
      ? "Telugu Synthesizer"
      : "Storyteller & Synthesizer";
  const host2Name = "Avinash";

  if (mode === "podcast") {
    return (
      <div className="w-full bg-white/85 border border-[#0f0f10]/12 p-3 sm:p-4 backdrop-blur-md shadow-2xs space-y-3">
        {/* Top Telemetry Strip */}
        <div className="flex items-center justify-between text-xs font-mono border-b border-[#0f0f10]/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-emerald-600" />
            </span>
            <span className="text-[11px] uppercase tracking-widest font-semibold text-[#0f0f10]">
              [ LIVE ROUNDTABLE BROADCAST ]
            </span>
            <span className="text-[#0f0f10]/20 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-[#0f0f10]/60 text-[10px] truncate max-w-xs">
              {topicTitle || "Dialectical Exploration"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-[#0f0f10]/50 uppercase tracking-wider hidden sm:inline">
              Format: 3-Way Roundtable
            </span>
            <span className="text-[#0f0f10]/20 hidden sm:inline">·</span>
            <span className="font-mono text-[#b8945c] font-semibold">
              BEAT {String(turnCount).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* 3 Participant Desk Stations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Station 1: Host 1 (The Anchor) */}
          <div
            className={`p-2.5 border transition-all duration-200 flex items-center justify-between shadow-2xs ${
              activeSpeaker === "host1"
                ? "border-[#b8945c] bg-[#b8945c]/5 text-[#0f0f10]"
                : "border-[#0f0f10]/10 bg-white/60 text-[#0f0f10]/70"
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#b8945c] font-semibold">
                <Radio className="w-3 h-3" />
                <span>Anchor</span>
                <span className="text-[#0f0f10]/30">·</span>
                <span className="text-[#0f0f10]">{host1Name}</span>
              </div>
              <p className="font-mono text-[9px] text-[#0f0f10]/50 truncate">
                {host1Role}
              </p>
            </div>

            {/* Soundwave equalizer indicator */}
            <div className="flex items-end gap-0.5 h-3.5 pl-2 shrink-0">
              {activeSpeaker === "host1" ? (
                <>
                  <span className="w-0.5 bg-[#b8945c] animate-pulse h-2.5" />
                  <span className="w-0.5 bg-[#b8945c] animate-pulse h-3.5 delay-75" />
                  <span className="w-0.5 bg-[#b8945c] animate-pulse h-2 delay-150" />
                </>
              ) : (
                <>
                  <span className="w-0.5 bg-[#0f0f10]/20 h-1" />
                  <span className="w-0.5 bg-[#0f0f10]/20 h-1.5" />
                  <span className="w-0.5 bg-[#0f0f10]/20 h-1" />
                </>
              )}
            </div>
          </div>

          {/* Station 2: Host 2 (The Provocateur) */}
          <div
            className={`p-2.5 border transition-all duration-200 flex items-center justify-between shadow-2xs ${
              activeSpeaker === "host2"
                ? "border-[#c86446] bg-[#c86446]/5 text-[#0f0f10]"
                : "border-[#0f0f10]/10 bg-white/60 text-[#0f0f10]/70"
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#c86446] font-semibold">
                <Swords className="w-3 h-3" />
                <span>Provocateur</span>
                <span className="text-[#0f0f10]/30">·</span>
                <span className="text-[#0f0f10]">{host2Name}</span>
              </div>
              <p className="font-mono text-[9px] text-[#0f0f10]/50 truncate">
                Devil&apos;s Advocate &amp; Friction
              </p>
            </div>

            {/* Soundwave equalizer indicator */}
            <div className="flex items-end gap-0.5 h-3.5 pl-2 shrink-0">
              {activeSpeaker === "host2" ? (
                <>
                  <span className="w-0.5 bg-[#c86446] animate-pulse h-3" />
                  <span className="w-0.5 bg-[#c86446] animate-pulse h-3.5 delay-100" />
                  <span className="w-0.5 bg-[#c86446] animate-pulse h-2 delay-200" />
                </>
              ) : (
                <>
                  <span className="w-0.5 bg-[#0f0f10]/20 h-1" />
                  <span className="w-0.5 bg-[#0f0f10]/20 h-1.5" />
                  <span className="w-0.5 bg-[#0f0f10]/20 h-1" />
                </>
              )}
            </div>
          </div>

          {/* Station 3: Guest (You) */}
          <div
            className={`p-2.5 border transition-all duration-200 flex items-center justify-between shadow-2xs ${
              activeSpeaker === "user"
                ? "border-emerald-600 bg-emerald-500/5 text-[#0f0f10]"
                : "border-[#0f0f10]/10 bg-white/60 text-[#0f0f10]/70"
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                <User className="w-3 h-3" />
                <span>Guest Thinker</span>
                <span className="text-[#0f0f10]/30">·</span>
                <span className="text-[#0f0f10] truncate max-w-[80px]">
                  {userName.split(" ")[0]}
                </span>
              </div>
              <p className="font-mono text-[9px] text-[#0f0f10]/50 truncate">
                {activeSpeaker === "user" ? "Transmitting audio..." : "Arbiter · Floor Open"}
              </p>
            </div>

            {/* Soundwave equalizer indicator */}
            <div className="flex items-end gap-0.5 h-3.5 pl-2 shrink-0">
              {activeSpeaker === "user" ? (
                <>
                  <span className="w-0.5 bg-emerald-600 animate-pulse h-3" />
                  <span className="w-0.5 bg-emerald-600 animate-pulse h-3.5 delay-75" />
                  <span className="w-0.5 bg-emerald-600 animate-pulse h-2.5 delay-150" />
                </>
              ) : (
                <span className="font-mono text-[9px] text-emerald-700 uppercase tracking-wide">
                  READY
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1-on-1 Sparring Arena Header
  return (
    <div className="w-full bg-white/80 border border-[#0f0f10]/12 p-3 sm:p-3.5 backdrop-blur-sm shadow-2xs">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full bg-[#b8945c] opacity-75" />
            <span className="relative inline-flex h-2 w-2 bg-[#b8945c]" />
          </span>
          <span className="uppercase tracking-widest text-[#0f0f10]/50 text-[11px]">
            Dialectic Arena
          </span>
          <span className="text-[#0f0f10]/20">·</span>
          <span className="text-[#0f0f10] font-medium truncate max-w-[160px] sm:max-w-none">
            {topicTitle || "Socratic Cross-Examination"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[#0f0f10]/70">
          <span className="hidden sm:inline text-[#0f0f10]/50 text-[10px]">
            1-on-1 Socratic Friction
          </span>
          <span className="hidden sm:inline text-[#0f0f10]/20">·</span>
          <span className="font-mono text-[#b8945c] font-semibold text-[11px]">
            TURN {String(turnCount).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
