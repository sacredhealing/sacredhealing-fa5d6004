// Shared helper: invoke the akasha-codex-curator and show a toast confirming
// exactly what happened to the SQI response (which book, which chapter, new vs merged).

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CuratorChapter {
  codex: "akasha" | "portrait";
  chapterId: string;
  action: "created" | "merged_exact" | "merged_embedding" | "merged_alias";
  title: string;
}

interface CuratorResultItem {
  ok?: boolean;
  excluded?: boolean;
  reason?: string;
  chapters?: CuratorChapter[];
  error?: string;
}

interface CuratorPayload {
  raw_content: string;
  user_prompt?: string;
  source_type?: string;
  source_chat_id?: string | null;
  source_message_id?: string | null;
}

const BOOK_LABEL = {
  akasha: "Akashic Codex",
  portrait: "Soul Portrait",
} as const;

const ACTION_LABEL = {
  created: "New chapter",
  merged_exact: "Added to",
  merged_embedding: "Added to",
  merged_alias: "Added to",
} as const;

export async function curateAndNotify(payload: CuratorPayload): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke("akasha-codex-curator", {
      body: payload,
    });

    if (error) {
      console.warn("[codex] curator hook failed:", error);
      toast({
        title: "Codex save failed",
        description: "This response was not added to your books. Try the Paste panel manually.",
        variant: "destructive",
      });
      return;
    }

    const results: CuratorResultItem[] = (data?.results as CuratorResultItem[]) ?? [];
    const first = results[0];

    if (!first) {
      toast({ title: "Codex: no response", description: "Curator returned no result." });
      return;
    }

    if (first.excluded) {
      toast({
        title: "Not added to books",
        description: first.reason
          ? `Excluded: ${first.reason}`
          : "Classified as ephemeral / non-teaching content.",
      });
      return;
    }

    if (!first.chapters || first.chapters.length === 0) {
      toast({
        title: "Codex returned nothing",
        description: first.error ?? "No chapter was created or updated.",
        variant: "destructive",
      });
      return;
    }

    for (const ch of first.chapters) {
      toast({
        title: `${BOOK_LABEL[ch.codex]} · ${ACTION_LABEL[ch.action]}`,
        description: ch.action === "created"
          ? `New chapter: "${ch.title}"`
          : `"${ch.title}" (${ch.action.replace("merged_", "match: ")})`,
      });
    }
  } catch (err) {
    console.warn("[codex] curator hook threw:", err);
    toast({
      title: "Codex save failed",
      description: err instanceof Error ? err.message : String(err),
      variant: "destructive",
    });
  }
}
