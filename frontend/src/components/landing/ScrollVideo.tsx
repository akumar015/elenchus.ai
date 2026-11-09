"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollVideoProps {
  className?: string;
}

export function ScrollVideo({ className = "" }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 1. Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 2. Playback handling (respecting reduced motion)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reducedMotion) {
      video.pause();
      video.currentTime = 2.0;
    } else {
      video.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, [reducedMotion]);

  return (
    <>
      {/* Editorial black hairline bar across the top edge */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[1.5px] bg-[#0f0f10] z-50 pointer-events-none"
      />

      <div
        aria-hidden="true"
        className={`fixed inset-0 h-full w-full pointer-events-none z-0 overflow-hidden bg-[#fbfbf9] ${className}`}
      >
        <video
          ref={videoRef}
          src="/waves-golden.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
        />

        {/* Soft luminous veil preserving crisp typography legibility */}
        <div className="absolute inset-0 bg-[#fbfbf9]/10 pointer-events-none" />
      </div>
    </>
  );
}
