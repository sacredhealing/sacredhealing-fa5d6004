// src/data/moduleContentIndex.ts
// ⟡ MASTER CONTENT INDEX — All module phases unified ⟡
// Import from here in UI (see AgastyarModule.tsx).

import { MODULE_CONTENT, type ModuleContent } from './moduleContent';
import { MODULE_CONTENT_PHASE2 } from './moduleContentPhase2';
import { MODULE_CONTENT_PHASE3 } from './moduleContentPhase3';
import { MODULE_CONTENT_PHASE4 } from './moduleContentPhase4';
import { MODULE_CONTENT_PHASE5 } from './moduleContentPhase5';

/** Unified map: Phase 1–5 bundles merged by module_number */
export const ALL_MODULE_CONTENT: Record<number, ModuleContent> = {
  ...MODULE_CONTENT,
  ...MODULE_CONTENT_PHASE2,
  ...MODULE_CONTENT_PHASE3,
  ...MODULE_CONTENT_PHASE4,
  ...MODULE_CONTENT_PHASE5,
};

/** Single lookup for any module's rich in-app content */
export function getAllModuleContent(moduleNumber: number): ModuleContent | null {
  return ALL_MODULE_CONTENT[moduleNumber] ?? null;
}

export const PHASE_INFO = {
  1: { name: 'Adhi Vidya', subtitle: 'Foundation of Siddha Wisdom', modules: [1, 12] as const, tier: 'free' },
  2: { name: 'Jijnasa', subtitle: 'The Science Deepens', modules: [13, 24] as const, tier: 'prana-flow' },
  3: { name: 'Vaidya Tantra', subtitle: "The Physician's Art", modules: [25, 36] as const, tier: 'siddha-quantum' },
  4: { name: 'Siddha Vidya', subtitle: 'The Living Transmission', modules: [37, 72] as const, tier: 'akasha-infinity' },
  5: { name: 'Atma Vidya', subtitle: 'The Science of the Self', modules: [73, 108] as const, tier: 'akasha-infinity' },
} as const;

export type { ModuleContent };
