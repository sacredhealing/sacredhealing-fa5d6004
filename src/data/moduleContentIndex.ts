// src/data/moduleContentIndex.ts
// ⟡ MASTER CONTENT INDEX — All 108 Modules Unified ⟡
// Import this file wherever module content is needed

import { MODULE_CONTENT, type ModuleContent } from './moduleContent';
import { MODULE_CONTENT_PHASE2 } from './moduleContentPhase2';
import { MODULE_CONTENT_PHASE3 } from './moduleContentPhase3';
import { MODULE_CONTENT_PHASE4 } from './moduleContentPhase4';
import { MODULE_CONTENT_PHASE5 } from './moduleContentPhase5';

// ── Unified map of ALL 108 modules ──────────────────────────
export const ALL_MODULE_CONTENT: Record<number, ModuleContent> = {
  ...MODULE_CONTENT,
  ...MODULE_CONTENT_PHASE2,
  ...MODULE_CONTENT_PHASE3,
  ...MODULE_CONTENT_PHASE4,
  ...MODULE_CONTENT_PHASE5,
};

// ── Single function to get any module's content ──────────────
export function getAllModuleContent(moduleNumber: number): ModuleContent | null {
  return ALL_MODULE_CONTENT[moduleNumber] ?? null;
}

// ── Phase metadata ───────────────────────────────────────────
export const PHASE_INFO = {
  1: { name: 'Adhi Vidya', subtitle: 'Foundation of Siddha Wisdom', modules: [1, 12], tier: 'free' },
  2: { name: 'Jijnasa', subtitle: 'The Science Deepens', modules: [13, 24], tier: 'prana-flow' },
  3: { name: 'Vaidya Tantra', subtitle: "The Physician's Art", modules: [25, 36], tier: 'siddha-quantum' },
  4: { name: 'Siddha Vidya', subtitle: 'The Living Transmission', modules: [37, 72], tier: 'akasha-infinity' },
  5: { name: 'Atma Vidya', subtitle: 'The Science of the Self', modules: [73, 108], tier: 'akasha-infinity' },
} as const;

export type { ModuleContent };
