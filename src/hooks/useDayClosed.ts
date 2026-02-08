import { useCallback, useState } from 'react';

const STORAGE_KEY_PREFIX = 'sh_day_closed_';

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}${getTodayKey()}`;
}

function getIsDayClosedSync(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(getStorageKey()) === '1';
}

export function useDayClosed() {
  const [isDayClosed, setIsDayClosed] = useState(getIsDayClosedSync);

  const markDayClosed = useCallback(() => {
    localStorage.setItem(getStorageKey(), '1');
    setIsDayClosed(true);
  }, []);

  return { isDayClosed, markDayClosed };
}
