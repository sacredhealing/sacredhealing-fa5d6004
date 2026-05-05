// One-tap copy for chat bubbles; avoids native selection (no Android selection/Google bar).

import { useState, useCallback, useRef, useEffect } from 'react';

export function useCopyMessage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const copyMessage = useCallback(async (text: string, id: string) => {
    const scheduleResetCopied = () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        setCopiedId(null);
        clearTimerRef.current = null;
      }, 2000);
    };

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      scheduleResetCopied();
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
      scheduleResetCopied();
    }
  }, []);

  return { copyMessage, copiedId };
}
