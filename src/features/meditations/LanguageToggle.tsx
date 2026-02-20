import type { ContentLanguage } from "@/utils/contentLanguage";
import { LotusIcon } from "@/components/icons/LotusIcon";
import { Leaf } from "lucide-react";

type Props = {
  language: ContentLanguage;
  setLanguage: (lang: ContentLanguage) => void;
  /** Temple mode: lotus + leaf icons only, no label */
  compact?: boolean;
};

/** Meditation content filter. Compact = elegant lotus/leaf icons for Temple aesthetic. */
export function LanguageToggle({ language, setLanguage, compact }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <button
          aria-label="Svenska"
          className={`p-2 rounded-lg transition ${
            language === "sv" ? "text-[#D4AF37] bg-[#D4AF37]/15" : "text-muted-foreground hover:text-foreground/80"
          }`}
          onClick={() => setLanguage("sv")}
        >
          <LotusIcon size={20} />
        </button>
        <button
          aria-label="English"
          className={`p-2 rounded-lg transition ${
            language === "en" ? "text-[#D4AF37] bg-[#D4AF37]/15" : "text-muted-foreground hover:text-foreground/80"
          }`}
          onClick={() => setLanguage("en")}
        >
          <Leaf className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 mt-3">
      <div className="flex rounded-full bg-black p-1 border border-[#D4AF37]/60">
        <button
          className={`px-4 py-2 rounded-full text-sm transition ${
            language === "sv" ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setLanguage("sv")}
        >
          Svenska
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm transition ${
            language === "en" ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setLanguage("en")}
        >
          English
        </button>
      </div>
    </div>
  );
}
