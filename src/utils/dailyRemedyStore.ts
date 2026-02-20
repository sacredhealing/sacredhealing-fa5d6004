/**
 * Daily Remedy store — Transmutation Mantras added from "Break the Vow".
 */

const STORAGE_KEY = 'sh:dailyRemedies';

export interface DailyRemedy {
  id: string;
  mantra: string;
  mantraName: string;
  shadowVow: string;
  addedAt: string; // ISO
}

export function getDailyRemedies(): DailyRemedy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addDailyRemedy(remedy: Omit<DailyRemedy, 'id' | 'addedAt'>): void {
  try {
    const list = getDailyRemedies();
    const existing = list.find(
      (r) => r.mantra === remedy.mantra && r.mantraName === remedy.mantraName
    );
    if (existing) return;
    const entry: DailyRemedy = {
      ...remedy,
      id: `remedy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      addedAt: new Date().toISOString(),
    };
    list.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
