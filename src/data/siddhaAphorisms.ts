/**
 * 18 Siddhar aphorisms — for Siddha Wisdom daily notification.
 */

export const SIDDHA_APHORISMS: readonly string[] = [
  'The body is the temple; the breath is the priest. — Agastya',
  'What you resist persists. Dissolve it in awareness. — Tirumular',
  'The alchemist turns lead to gold; the Siddha turns desire to peace. — Bogar',
  'In the cave of the heart, the flame never dies. — Konganar',
  'Silence speaks the language the soul understands. — Sattaimuni',
  'The path is not outside; it runs through the center of you. — Sundaranandar',
  'When the mind stills, the universe delivers. — Ramadevar',
  'The serpent power rises when the ego sleeps. — Pambatti',
  'Healing is not fixing; it is remembering what was never broken. — Karuvurar',
  'The breath that enters is borrowed; the one that leaves is returned. — Idaikkadar',
  'Master the body, and the mind will follow. — Machamuni',
  'Health is the first wealth; clarity, the first power. — Dhanvanthri',
  'The body bows so the soul may rise. — Patanjali',
  'Every cell remembers. Awaken the memory. — Nandidevar',
  'Fire transforms; do not fear the burn. — Korakkar',
  'The cosmos breathes through you. Let it. — Romarishi',
  'Truth is simple; the mind makes it complex. — Thiruvalluvar',
  'The 18 paths converge at the one. — Cattaimuni',
] as const;

/** Get today's Siddha aphorism (deterministic by date) */
export function getTodaysSiddhaAphorism(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000)
  );
  const idx = dayOfYear % SIDDHA_APHORISMS.length;
  return SIDDHA_APHORISMS[idx];
}
