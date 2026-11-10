/**
 * Global audio playback manager for elenchus.ai.
 * Holds module-level singleton references to prevent stray audio elements
 * from surviving page transitions or unmounts.
 */

let activeAudio: HTMLAudioElement | null = null;

export function registerActiveAudio(player: HTMLAudioElement): void {
  if (activeAudio && activeAudio !== player) {
    try {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch (e) {
      console.warn("Could not pause previous audio element:", e);
    }
  }
  activeAudio = player;
}

export function stopAllGlobalAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch (e) {
      console.warn("Could not pause active global audio:", e);
    }
    activeAudio = null;
  }

  // Also query the DOM for any stray <audio> elements
  if (typeof document !== "undefined") {
    try {
      const audios = document.querySelectorAll("audio");
      audios.forEach((a) => {
        try {
          a.onended = null;
          a.onerror = null;
          a.pause();
          a.currentTime = 0;
          a.src = "";
        } catch {}
      });
    } catch {}
  }
}
