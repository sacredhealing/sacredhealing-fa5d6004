import type { ContentLanguage } from "@/utils/contentLanguage";

type Props = {
  language: ContentLanguage;
  setLanguage: (lang: ContentLanguage) => void;
};

export function LanguageToggle({ language, setLanguage }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mt-3">
      <div className="text-sm text-muted-foreground">
        {language === "sv" ? "Språk" : "Language"}
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
