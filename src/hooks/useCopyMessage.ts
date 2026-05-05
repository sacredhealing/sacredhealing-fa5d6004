import { useState, useCallback } from 'react';

/** One-tap copy for chat bubbles; avoids native selection (no Android selection/Google bar). */
export function useCopyMessage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyMessage = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  return { copyMessage, copiedId };
}
