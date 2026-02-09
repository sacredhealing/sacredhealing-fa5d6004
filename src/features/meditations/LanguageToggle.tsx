import { useTranslation } from "react-i18next";
import type { ContentLanguage } from "@/utils/contentLanguage";

type Props = {
  language: ContentLanguage;
  setLanguage: (lang: ContentLanguage) => void;
};

/** Meditation content filter only — label in app language. */
export function LanguageToggle({ language, setLanguage }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 mt-3">
      <div className="text-sm text-muted-foreground">
        {t("meditations.meditationLanguage", "Meditation language")}
      </div>

      <div className="flex rounded-full bg-muted/30 p-1 border border-border">
        <button
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
