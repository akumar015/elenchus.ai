"use client";

import { ThoughtCard } from "@/types/spar";
import { Brain, Target, AlertTriangle, Zap } from "lucide-react";

interface AtomicThoughtCardProps {
  card: ThoughtCard;
  topicTitle?: string;
}

const SECTIONS = [
  {
    key: "core_thesis" as const,
    label: "Core Thesis",
    icon: Brain,
    color: "text-elenchus-chalk",
    borderColor: "border-elenchus-border",
    bgColor: "bg-elenchus-surface-2/60",
    iconColor: "text-elenchus-stone",
  },
  {
    key: "user_stance" as const,
    label: "Your Stance",
    icon: Target,
    color: "text-elenchus-chalk",
    borderColor: "border-elenchus-emerald/30",
    bgColor: "bg-elenchus-emerald/5",
    iconColor: "text-emerald-400",
  },
  {
    key: "blind_spots" as const,
    label: "Blind Spots Exposed",
    icon: AlertTriangle,
    color: "text-elenchus-chalk",
    borderColor: "border-elenchus-amber/30",
    bgColor: "bg-elenchus-amber/5",
    iconColor: "text-elenchus-amber",
  },
  {
    key: "key_insight" as const,
    label: "Key Insight",
    icon: Zap,
    color: "text-elenchus-chalk",
    borderColor: "border-elenchus-terracotta/30",
    bgColor: "bg-elenchus-terracotta/5",
    iconColor: "text-elenchus-terracotta",
  },
] as const;

export function AtomicThoughtCard({ card, topicTitle }: AtomicThoughtCardProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-elenchus-emerald">
          Atomic Thought Card
        </p>
        {topicTitle && (
          <p className="font-serif text-sm text-elenchus-stone italic">
        &ldquo;{topicTitle}&rdquo;
        </p>
        )}
      </div>

      {/* Four fields */}
      <div className="space-y-3">
        {SECTIONS.map(({ key, label, icon: Icon, borderColor, bgColor, iconColor }) => (
          <div
            key={key}
            className={`rounded-lg border ${borderColor} ${bgColor} p-3.5 space-y-1.5`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-3.5 h-3.5 ${iconColor} flex-shrink-0`} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-elenchus-stone">
                {label}
              </span>
            </div>
            <p className="text-xs text-elenchus-chalk leading-relaxed pl-5">
              {card[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}