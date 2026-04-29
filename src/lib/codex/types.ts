// ============================================================
// SQI 2050 Codex — TypeScript types
// ============================================================

export type CodexType = "akasha" | "portrait";

export type CodexTarget = "akasha" | "portrait" | "split" | "excluded";

export type SourceType =
  | "apothecary"
  | "manual_paste"
  | "file_upload"
  | "voice_memo"
  | "backfill";

export interface TransmissionBlock {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_message_id: string | null;
  source_chat_id: string | null;
  source_metadata: Record<string, unknown>;
  user_prompt: string | null;
  raw_content: string;
  original_date: string | null;
  codex_target: CodexTarget;
  routing_override: "auto" | "force_akasha" | "force_portrait";
  topic_primary: string | null;
  topic_sub: string | null;
  classified_at: string | null;
  created_at: string;
}

export interface CodexChapter {
  id: string;
  user_id: string;
  codex_type: CodexType;
  parent_id: string | null;
  title: string;
  slug: string;
  opening_hook: string | null;
  prose_woven: string | null;
  closing_reflection: string | null;
  image_url: string | null;
  image_prompt: string | null;
  image_storage_path: string | null;
  image_generated_at: string | null;
  order_index: number;
  depth: number;
  version: number;
  is_auto_generated: boolean;
  cluster_strength: number | null;
  child_count: number;
  created_at: string;
  updated_at: string;
  // Tree shape (decorated client-side)
  children?: CodexChapter[];
}

export interface CodexChapterVersion {
  id: string;
  chapter_id: string;
  version: number;
  prose_snapshot: string;
  trigger_event: string | null;
  created_at: string;
}

export interface CodexCrossRef {
  id: string;
  from_chapter_id: string;
  to_chapter_id: string;
  theme: string | null;
  strength: number | null;
}

export interface CodexSettings {
  user_id: string;
  narrator_voice: string;
  bestseller_intensity: "minimal" | "restrained" | "full";
  auto_image_generation: boolean;
  auto_merge_threshold: number;
  auto_merge_enabled: boolean;
  last_backfill_at: string | null;
  last_curator_run_at: string | null;
}

export interface PasteInput {
  raw_content: string;
  user_prompt?: string;
  routing_override?: "auto" | "force_akasha" | "force_portrait";
  original_date?: string;
  source_type?: SourceType;
  source_metadata?: Record<string, unknown>;
}
