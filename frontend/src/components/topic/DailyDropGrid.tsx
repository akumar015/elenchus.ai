"use client";

import { useEffect, useState, useMemo } from "react";
import { Topic } from "@/types/topic";
import { TopicCard } from "./TopicCard";
import { api } from "@/lib/api";
import { STARTER_TOPICS } from "@/lib/starterTopics";
import { Sparkles, Layers } from "lucide-react";

export function DailyDropGrid() {
  const [topics, setTopics] = useState<Topic[]>(STARTER_TOPICS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getDailyTopics()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setTopics(data);
        }
      })
      .catch((err) => {
        // Fallback gracefully to starter topics
        console.warn("Using offline starter topics:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(topics.map((t) => t.category)));
    return ["all", ...cats];
  }, [topics]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    if (selectedCategory === "all") return topics;
    return topics.filter(
      (t) => t.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [topics, selectedCategory]);

  return (
    <section className="space-y-8">
      {/* Section Header & Category Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-elenchus-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-elenchus-terracotta mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Daily Drops</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-elenchus-chalk tracking-tight">
            Select Your Sparring Duel
          </h2>
          <p className="text-elenchus-stone text-sm mt-1">
            8 mental models designed to stress-test your reasoning. No passive listening allowed.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-all ${
                selectedCategory === category
                  ? "bg-elenchus-chalk text-elenchus-ground font-medium shadow-sm"
                  : "bg-elenchus-surface-1 border border-elenchus-border text-elenchus-muted hover:text-elenchus-stone hover:border-elenchus-border-strong"
              }`}
            >
              {category === "all" ? "All Sparks" : category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>

      {filteredTopics.length === 0 && !loading && (
        <div className="text-center py-16 border border-dashed border-elenchus-border rounded-xl">
          <Layers className="w-8 h-8 mx-auto text-elenchus-muted mb-2" />
          <p className="text-elenchus-stone font-mono text-sm">
            No sparks found in this category.
          </p>
        </div>
      )}
    </section>
  );
}
