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

// ─────────────────────────────────────────────────────────────────
// R2 Audio Proxy — routes r2.dev URLs through Vercel edge function
// to bypass CORS/host-allowlist restrictions on the R2 bucket.
// ─────────────────────────────────────────────────────────────────
const R2_HOST = 'pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev';

export function proxyAudioUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === R2_HOST) {
      // /meditations/foo.wav → /api/audio/meditations/foo.wav
      const path = parsed.pathname; // already has leading /
      return `/api/audio${path}`;
    }
  } catch {
    // not a valid URL — return as-is
  }
  return url;
}
