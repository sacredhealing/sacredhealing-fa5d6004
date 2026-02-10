import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ContentLang = "sv" | "en";

interface ContentLanguagePickerProps {
  value: ContentLang;
  onChange: (v: ContentLang) => void;
}

const LABELS: Record<ContentLang, { en: string; sv: string }> = {
  sv: { en: "Svenska", sv: "Svenska" },
  en: { en: "English", sv: "English" },
};

/**
 * Content language filter: single pill showing current language; tap opens menu to switch.
 * Labels shown in app language for the pill; option in menu is the other language.
 */
export function ContentLanguagePicker({ value, onChange }: ContentLanguagePickerProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const appLang = (i18n.language?.split("-")[0] || "en") as "en" | "sv";
  const label = LABELS[value][appLang];
  const other: ContentLang = value === "sv" ? "en" : "sv";
  const otherLabel = LABELS[other][appLang];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5 border-border bg-muted/30"
        >
          <span>{label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <button
          type="button"
          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          onClick={() => {
            onChange(other);
            setOpen(false);
          }}
        >
          {otherLabel}
        </button>
      </PopoverContent>
    </Popover>
  );
}
