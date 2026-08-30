let lastQuackTime = 0;
let audioInstance: HTMLAudioElement | null = null;

export function playQuackSound() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  // Prevent rapid hover spam
  if (now - lastQuackTime < 400) return;
  lastQuackTime = now;

  try {
    if (!audioInstance) {
      audioInstance = new Audio("/duck-sound.mp3");
      audioInstance.volume = 0.75;
    } else {
      audioInstance.currentTime = 0;
    }

    audioInstance.play().catch((error) => {
      console.debug("Audio playback notice:", error);
    });
  } catch (error) {
    console.debug("DataDuck sound error:", error);
  }
}