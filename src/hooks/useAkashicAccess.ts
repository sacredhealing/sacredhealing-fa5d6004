import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'akashic_reveal_purchased';

/** Tracks whether user has purchased the high-ticket Akashic Deep Reading ($49). */
export function useAkashicAccess(): { hasAccess: boolean; setAccess: () => void } {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasAccess, setHasAccessState] = useState(false);

  useEffect(() => {
    const unlocked = searchParams.get('unlocked');
    if (unlocked === '1' || unlocked === 'akashic') {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {}
      setHasAccessState(true);
      // Clean URL
      searchParams.delete('unlocked');
      setSearchParams(searchParams, { replace: true });
      return;
    }
    try {
      setHasAccessState(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setHasAccessState(false);
    }
  }, [searchParams, setSearchParams]);

  const setAccess = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setHasAccessState(true);
  };

  return { hasAccess, setAccess };
}
