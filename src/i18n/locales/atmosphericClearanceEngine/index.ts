import partUiEn from './part-ui-en.json';
import { atmosphericClearanceKbEn } from './kb-en';

export const atmosphericClearanceEngineEn = {
  ...(partUiEn as Record<string, unknown>),
  kb: atmosphericClearanceKbEn,
} as Record<string, unknown>;
