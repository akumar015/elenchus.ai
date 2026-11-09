"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface BackgroundVideoProps {
  videoSrc?: string;
  posterSrc?: string;
}

export function BackgroundVideo({
  videoSrc = "/assets/elenchus-acoustic-loop.mp4",
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          // Autoplay blocked by browser policy until interaction
          console.log("[elenchus.ai] Autoplay pending interaction:", err?.name);
        });
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Direct DOM attribute enforcement for strict browser autoplay policies
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    // Attempt playback immediately
    attemptPlay();

    // Listen to video lifecycle events
    const onLoadedMetadata = () => {
      attemptPlay();
    };
    const onCanPlay = () => {
      attemptPlay();
    };
    const onPlaying = () => {
      setIsPlaying(true);
    };
    const onError = (e: Event) => {
      console.error("[elenchus.ai] Background video error:", e);
      setHasError(true);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    // Global interaction fallbacks to guarantee playback starts on ANY user gesture
    const handleUserGesture = () => {
      if (video.paused) {
        attemptPlay();
      }
    };

    window.addEventListener("pointerdown", handleUserGesture, { passive: true });
    window.addEventListener("touchstart", handleUserGesture, { passive: true });
    window.addEventListener("scroll", handleUserGesture, { passive: true });
    window.addEventListener("wheel", handleUserGesture, { passive: true });
    window.addEventListener("keydown", handleUserGesture, { passive: true });
    window.addEventListener("click", handleUserGesture, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
      window.removeEventListener("scroll", handleUserGesture);
      window.removeEventListener("wheel", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("click", handleUserGesture);
    };
  }, [attemptPlay, videoSrc]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 h-full w-full pointer-events-none z-0 overflow-hidden"
    >
      {/* 
        Direct HTML5 Video Background:
        - src attribute placed directly on <video> with media fragment #t=0.001 to guarantee immediate frame 0 render
        - <source> children provide standard mime-type fallback
        - muted, playsInline, autoPlay, loop, defaultMuted guarantee browser autoplay compliance
      */}
      <video
        ref={(el) => {
          if (el) {
            videoRef.current = el;
            el.defaultMuted = true;
            el.muted = true;
            el.playsInline = true;
          }
        }}
        src={`${videoSrc}#t=0.001`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Luminous veil: 5% opacity so text is readable while the amber acoustic wave sculpture is vividly visible */}
      <div className="absolute inset-0 bg-[#fbfbf9]/5 pointer-events-none" />

      {/* Manual interactive resume button if strict browser policy completely halted autoplay */}
      {!isPlaying && !hasError && (
        <div className="absolute top-20 right-6 pointer-events-auto z-50 sm:hidden">
          <button
            onClick={attemptPlay}
            className="px-3 py-1 border border-[#0f0f10]/15 bg-white/80 backdrop-blur-sm font-mono text-[10px] uppercase tracking-wider text-[#0f0f10]/70 hover:border-[#0f0f10] transition-colors shadow-2xs"
          >
            ▶ Play Visual
          </button>
        </div>
      )}
    </div>
  );
}
