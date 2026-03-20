// SQI-2050 Singleton Audio Engine — One Source, One Stream
// Prevents audio overlap and stale-ref stop failures (mantras, previews, etc.)

let currentAudio: HTMLAudioElement | null = null;

export type AudioEnginePlayOptions = {
  /** If true, `onEnded` fires on every natural end (e.g. 108 mantra reps). Default: false (once). */
  endedEveryRepeat?: boolean;
  onPlayError?: (err: unknown) => void;
};

export const audioEngine = {
  play(src: string, onEnded?: () => void, options?: AudioEnginePlayOptions): HTMLAudioElement {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio.load();
      currentAudio = null;
    }

    const audio = new Audio(src);
    audio.preload = 'auto';

    if (onEnded) {
      const once = !options?.endedEveryRepeat;
      audio.addEventListener('ended', onEnded, { once });
    }

    void audio.play().catch((err) => {
      console.error(err);
      options?.onPlayError?.(err);
    });
    currentAudio = audio;
    return audio;
  },

  stop() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
      currentAudio.load();
      currentAudio = null;
    }
  },

  pause() {
    currentAudio?.pause();
  },

  resume() {
    void currentAudio?.play().catch(console.error);
  },

  isPlaying(): boolean {
    return !!(currentAudio && !currentAudio.paused);
  },

  getCurrent(): HTMLAudioElement | null {
    return currentAudio;
  },
};
