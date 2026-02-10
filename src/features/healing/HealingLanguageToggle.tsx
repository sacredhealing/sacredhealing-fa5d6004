import { useTranslation } from "react-i18next";
import type { ContentLang } from "@/utils/healingContentLanguage";

type Props = {
  language: ContentLang;
  setLanguage: (lang: ContentLang) => void;
};

/** Healing page: meditation content language only — same pill UX as /meditations. */
export function HealingLanguageToggle({ language, setLanguage }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        {t("healing.meditationLanguage", "Meditation language")}
      </div>
      <div className="flex rounded-full bg-muted/30 p-1 border border-border">
        <button
          type="button"
          className={`px-4 py-2 rounded-full text-sm transition ${
            language === "sv"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setLanguage("sv")}
        >
          Svenska
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-full text-sm transition ${
            language === "en"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setLanguage("en")}
        >
          English
        </button>
      </div>
    </div>
  );
}
