import type { ModuleContent } from './tier1_free';
import { TIER1_CONTENT } from './tier1_free';
import { TIER2_CONTENT } from './tier2_prana';
import { TIER3_CONTENT } from './tier3_siddha';
import { TIER4_CONTENT } from './tier4_akasha';

const ALL_MODULES: ModuleContent[] = [
  ...TIER1_CONTENT,
  ...TIER2_CONTENT,
  ...TIER3_CONTENT,
  ...TIER4_CONTENT,
];

export function getModuleContent(moduleId: number): ModuleContent | undefined {
  return ALL_MODULES.find((m) => m.moduleId === moduleId);
}

export type { ModuleContent, KeyTerm, ContentSection, QuizQuestion } from './tier1_free';
