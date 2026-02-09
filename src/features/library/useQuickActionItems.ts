import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UniversalAudioItem } from "@/contexts/MusicPlayerContext";

interface Meditation {
  id: string;
  title: string;
  audio_url: string;
  cover_image_url: string | null;
  duration_minutes: number;
  category: string;
  shc_reward: number;
}

interface HealingAudio {
  id: string;
  title: string;
  audio_url: string;
  preview_url?: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  is_free: boolean;
}

export type QuickActionKey = "calm" | "heart" | "pause" | "sleep";

export interface QuickActionItems {
  calm: UniversalAudioItem | null;
  heart: UniversalAudioItem | null;
  pause: null; // navigates to /breathing
  sleep: UniversalAudioItem | null;
}

function meditationToUniversal(m: Meditation): UniversalAudioItem {
  return {
    id: m.id,
    title: m.title,
    artist: "Sacred Healing",
    audio_url: m.audio_url,
    cover_image_url: m.cover_image_url,
    duration_seconds: m.duration_minutes * 60,
    shc_reward: m.shc_reward,
    contentType: "meditation",
    originalData: m,
  };
}

function healingToUniversal(a: HealingAudio): UniversalAudioItem {
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
  };
}

export function useQuickActionItems() {
  const [items, setItems] = useState<QuickActionItems>({
    calm: null,
    heart: null,
    pause: null,
    sleep: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const [medRes, healRes] = await Promise.all([
        supabase.from("meditations").select("id, title, audio_url, cover_image_url, duration_minutes, category, shc_reward").order("created_at", { ascending: false }),
        supabase.from("healing_audio").select("id, title, audio_url, preview_url, cover_image_url, duration_seconds, is_free").order("created_at", { ascending: false }),
      ]);

      const meditations: Meditation[] = medRes.data || [];
      const healing: HealingAudio[] = healRes.data || [];

      // calm: short meditation (2-4 min), prefer healing category
      const calmItem =
        meditations.find((m) => m.duration_minutes >= 2 && m.duration_minutes <= 4 && m.category === "healing") ||
        meditations.find((m) => m.duration_minutes >= 2 && m.duration_minutes <= 4) ||
        meditations[0];

      // heart: first healing audio (comfort)
      const heartHealing = healing[0];

      // sleep: meditation with category sleep
      const sleepItem =
        meditations.find((m) => m.category === "sleep") ||
        meditations.find((m) => (m.title || "").toLowerCase().includes("sleep")) ||
        meditations.find((m) => m.duration_minutes >= 8);

      setItems({
        calm: calmItem ? meditationToUniversal(calmItem) : null,
        heart: heartHealing ? healingToUniversal(heartHealing) : null,
        pause: null,
        sleep: sleepItem ? meditationToUniversal(sleepItem) : null,
      });
    } catch (err) {
      console.error("Quick action items fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading };
}
