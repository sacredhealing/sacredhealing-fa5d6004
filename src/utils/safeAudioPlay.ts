/**
 * SQI Safe Audio Play Utility
 * Samsung A54 / Android Chrome: catches rejected play() promises, retries NotAllowedError,
 * guards MediaSession on unsupported devices.
 */

export async function safePlay(
  audio: HTMLAudioElement,
  onError?: (err: Error) => void,
): Promise<boolean> {
  try {
    await audio.play();
    return true;
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));

    if (e.name === 'NotAllowedError') {
      try {
        await new Promise((r) => setTimeout(r, 150));
        await audio.play();
        return true;
      } catch (retryErr: unknown) {
        const re = retryErr instanceof Error ? retryErr : new Error(String(retryErr));
        console.warn('[SQI] Audio play blocked after retry:', re.message);
        onError?.(re);
        return false;
      }
    }

    if (e.name === 'NotSupportedError') {
      console.warn('[SQI] Audio format not supported on this device:', e.message);
      onError?.(e);
      return false;
    }

    console.warn('[SQI] Audio play failed:', e.message);
    onError?.(e);
    return false;
  }
}

export function safeSetMediaSession(metadata: {
  title: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
}): void {
  try {
    if (!('mediaSession' in navigator)) return;
    if (typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
  } catch (err) {
    console.warn('[SQI] MediaSession metadata failed:', err);
  }
}

export function safeSetMediaSessionHandlers(
  handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>>,
): void {
  try {
    if (!('mediaSession' in navigator)) return;
    (Object.entries(handlers) as [MediaSessionAction, MediaSessionActionHandler | null | undefined][]).forEach(
      ([action, handler]) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler ?? null);
        } catch {
          /* action unsupported */
        }
      },
    );
  } catch (err) {
    console.warn('[SQI] MediaSession handlers failed:', err);
  }
}
