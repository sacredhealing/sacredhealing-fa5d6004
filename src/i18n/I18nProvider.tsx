// src/i18n/I18nProvider.tsx
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { Language } from "./index";
import { createT, supportedLanguages } from "./index";
import i18n from "./setup";
import { supabase } from "@/integrations/supabase/client";

type I18nCtx = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

export const I18nContext = createContext<I18nCtx | null>(null);

const LS_KEY = "app:lang";

function normalizeLanguage(raw: any): Language {
  return supportedLanguages.includes(raw) ? (raw as Language) : "en";
}

async function fetchProfileLanguage(userId: string): Promise<Language | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("user_id", userId)
      .single();

    if (error) return null;
    const raw = (data as { preferred_language?: string | null })?.preferred_language;
    if (!raw) return null;
    return normalizeLanguage(raw.split("-")[0]);
  } catch {
    return null;
  }
}

async function upsertProfileLanguage(userId: string, lang: Language) {
  try {
    await supabase
      .from("profiles")
      .update({ preferred_language: lang })
      .eq("user_id", userId);
  } catch {
    // ignore — local UI still updates
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return "en";
      return normalizeLanguage(raw);
    } catch {
      return "en";
    }
  });

  // Load from Supabase on mount + auth changes; on logout use localStorage then "en"
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        const stored = localStorage.getItem(LS_KEY);
        const fallback = stored && supportedLanguages.includes(stored as Language) ? (stored as Language) : "en";
        if (mounted) {
          setLanguageState(fallback);
          i18n.changeLanguage(fallback);
        }
        return;
      }

      const profLang = await fetchProfileLanguage(user.id);
      if (mounted && profLang) {
        setLanguageState(profLang);
        i18n.changeLanguage(profLang);
        try {
          localStorage.setItem(LS_KEY, profLang);
        } catch {
          // ignore
        }
      }
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    const next = normalizeLanguage(lang);

    // Instant UI update
    setLanguageState(next);
    i18n.changeLanguage(next);

    // Persist locally
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      // ignore
    }

    // Persist to Supabase if logged in
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      await upsertProfileLanguage(user.id, next);
    })();
  }, []);

  const t = useMemo(() => createT(language), [language]);

  const value = useMemo<I18nCtx>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

