"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollVideo } from "@/components/landing/ScrollVideo";
import { Navbar } from "@/components/landing/Navbar";
import { SectionOne } from "@/components/landing/SectionOne";
import { SectionTwo } from "@/components/landing/SectionTwo";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { COGNITIVE_FEATURES } from "@/components/landing/featuresData";
import { DialogueModal } from "@/components/landing/DialogueModal";
import { AboutModal } from "@/components/landing/AboutModal";
import { CognitiveModal } from "@/components/landing/CognitiveModal";
import { AuthModal } from "@/components/landing/AuthModal";

export default function Home() {
  const router = useRouter();
  const [dialogueModalOpen, setDialogueModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleInitiateDialogue = () => {
    router.push("/studio");
  };

  const handleScrollToFirstFeature = () => {
    const firstFeature = document.getElementById(COGNITIVE_FEATURES[0].id);
    if (firstFeature) {
      firstFeature.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen text-[#0f0f10] selection:bg-[#0f0f10]/12 selection:text-[#0f0f10] antialiased">
      {/* 1. Procedural, Scroll-Reactive Cymatic Acoustic Canvas Animation */}
      <ScrollVideo />

      {/* 2. Fixed Top Navigation */}
      <Navbar
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenArchitecture={() => setArchitectureModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onInitiateDialogue={handleInitiateDialogue}
      />

      {/* 3. Main Multi-Screen Editorial Experience (One Scroll per Feature) */}
      <main className="relative z-10 flex flex-col">
        {/* Screen 1: Hero */}
        <div id="section-hero">
          <SectionOne
            onInitiateDialogue={handleInitiateDialogue}
            onScrollToNext={handleScrollToFirstFeature}
          />
        </div>

        {/* Screens 2 to 5: The 4 Cognitive Retention Features (One Scroll Per Feature) */}
        {COGNITIVE_FEATURES.map((feature, idx) => (
          <FeatureSection
            key={feature.id}
            feature={feature}
            index={idx}
            total={COGNITIVE_FEATURES.length}
            onInitiateDialogue={handleInitiateDialogue}
          />
        ))}

        {/* Screen 6: Second Statement & Direct Arena Launch */}
        <div id="section-closing">
          <SectionTwo onStartVoiceSession={handleInitiateDialogue} />
        </div>
      </main>

      {/* 4. Voice Sparring Frequency / Dialogue Launcher */}
      <DialogueModal
        isOpen={dialogueModalOpen}
        onClose={() => setDialogueModalOpen(false)}
      />

      {/* 5. About Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        onExploreArchitecture={() => setArchitectureModalOpen(true)}
        onTryDemo={handleInitiateDialogue}
      />

      {/* 6. Cognitive Architecture Modal */}
      <CognitiveModal
        isOpen={architectureModalOpen}
        onClose={() => setArchitectureModalOpen(false)}
      />

      {/* 7. Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
