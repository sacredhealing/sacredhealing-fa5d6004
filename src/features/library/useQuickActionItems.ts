import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UniversalAudioItem } from "@/contexts/MusicPlayerContext";
import { getItemLanguage } from "@/features/meditations/getItemLanguage";

interface Meditation {
  id: string;
  title: string;
  audio_url: string;
  cover_image_url: string | null;
  duration_minutes: number;
  category: string;
  shc_reward: number;
  tags?: string[] | string | null;
  language?: string | null;
}

interface HealingAudio {
  id: string;
  title: string;
  audio_url: string;
  preview_url?: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  tags?: string[] | string | null;
  language?: string | null;
}

export type QuickActionKey = "calm" | "heart" | "pause" | "sleep";

/** Derive tags for resolver when DB has no tags (e.g. from category/title). */
function deriveTags(m: { category?: string; title?: string }, type: "meditation" | "healing"): string[] {
  const tags: string[] = [];
  const cat = (m.category ?? "").toLowerCase();
  const title = (m.title ?? "").toLowerCase();
  if (cat.includes("sleep") || title.includes("sleep")) tags.push("sleep", "unwind", "night");
  if (cat.includes("heal") || title.includes("heart") || title.includes("comfort")) tags.push("heart", "comfort", "soften");
  if (cat.includes("morning") || cat.includes("calm") || title.includes("calm") || title.includes("reset")) tags.push("calm", "reset", "ground");
  if (title.includes("breath") || title.includes("1 min") || title.includes("minute") || cat.includes("breath")) tags.push("breath", "breathing", "pause");
  return [...new Set(tags)];
}

function meditationToUniversal(m: Meditation): UniversalAudioItem & { tags?: string[]; language?: string } {
  const lang = getItemLanguage(m);
  return {
    id: m.id,
    title: m.title,
    artist: "Siddha Quantum Nexus",
    audio_url: m.audio_url,
    cover_image_url: m.cover_image_url,
    duration_seconds: m.duration_minutes * 60,
    shc_reward: m.shc_reward,
    contentType: "meditation",
    originalData: m,
    tags: Array.isArray(m.tags) ? m.tags.map((t) => String(t).toLowerCase()) : typeof m.tags === "string" ? m.tags.split(",").map((t) => t.trim().toLowerCase()) : deriveTags(m, "meditation"),
    language: lang === "unknown" ? undefined : lang,
  };
}

function healingToUniversal(a: HealingAudio): UniversalAudioItem & { tags?: string[]; language?: string } {
  const lang = getItemLanguage(a);
  return {
    id: a.id,
    title: a.title,
    artist: "Sacred Soul",
    audio_url: a.audio_url,
    cover_image_url: a.cover_image_url,
    duration_seconds: a.duration_seconds,
    shc_reward: a.is_free ? 0 : 0,
    contentType: "healing",
    originalData: a,
    tags: Array.isArray(a.tags) ? a.tags.map((t) => String(t).toLowerCase()) : typeof a.tags === "string" ? a.tags.split(",").map((t) => t.trim().toLowerCase()) : deriveTags({ category: "", title: a.title }, "healing"),
    language: lang === "unknown" ? undefined : lang,
  };
}

/** Combined list of meditation + healing items for resolver (tags + duration scoring). */
export function useQuickActionItems() {
  const [allAudioItems, setAllAudioItems] = useState<(UniversalAudioItem & { tags?: string[]; language?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const [medRes, healRes] = await Promise.all([
        supabase.from("meditations").select("id, title, audio_url, cover_image_url, duration_minutes, category, shc_reward").order("created_at", { ascending: false }),
        supabase.from("healing_audio").select("id, title, audio_url, preview_url, cover_image_url, duration_seconds, is_free").order("created_at", { ascending: false }),
      ]);

      const meditations: Meditation[] = medRes.data || [];
      const healing: HealingAudio[] = healRes.data || [];

      const list: (UniversalAudioItem & { tags?: string[]; language?: string })[] = [
        ...meditations.map(meditationToUniversal),
        ...healing.map(healingToUniversal),
      ];
      // Dev-only fixture for quick local test: tap Calm => resolver should pick "2-min Reset"
      if (import.meta.env.DEV) {
        list.push({
          id: "quick-action-fixture-calm",
          title: "2-min Reset",
          artist: "Sacred Healing",
          audio_url: "", // no play; verifies resolver picks by tags+duration
          cover_image_url: null,
          duration_seconds: 120,
          shc_reward: 0,
          contentType: "meditation",
          tags: ["reset"],
          language: "en",
        } as UniversalAudioItem & { tags?: string[]; language?: string });
      }
      setAllAudioItems(list);
    } catch (err) {
      console.error("Quick action items fetch error:", err);
      setAllAudioItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { allAudioItems: allAudioItems, loading };
}
