import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play, Pause, Clock, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { TranslatedText } from "@/components/TranslatedText";
import { Progress } from "@/components/ui/progress";

type Props = {
  title: string;
  subtitle?: string;
  items: any[];
  initialVisible?: number;
  defaultExpanded?: boolean;
  onPlay: (item: any) => void;
  isCurrentlyPlaying?: (id: string) => boolean;
  getProgress?: (id: string) => number;
  isPlaying?: boolean;
};

export function MeditationSection({
  title,
  subtitle,
  items,
  initialVisible = 6,
  defaultExpanded = false,
  onPlay,
  isCurrentlyPlaying,
  getProgress,
  isPlaying,
}: Props) {
  const { t } = useTranslation();
  const [sectionOpen, setSectionOpen] = useState(defaultExpanded);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const visibleItems = useMemo(() => {
    if (itemsExpanded) return items;
    return items.slice(0, initialVisible);
  }, [items, itemsExpanded, initialVisible]);

  if (!items?.length) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setSectionOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] transition text-left cave-flicker"
      >
        <div>
          <div className="text-lg font-semibold text-foreground">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        <div className="shrink-0 text-muted-foreground">
          {sectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {sectionOpen && (
        <div className="mt-3 pl-1">
          <div className="flex items-center justify-end gap-2 mb-2">
            {items.length > initialVisible ? (
              <button
                onClick={() => setItemsExpanded((v) => !v)}
                className="shrink-0 rounded-full border border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                {itemsExpanded
                  ? t("meditations.showLess", "Show less")
                  : t("meditations.showMore", "Show more")}
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
        {visibleItems.map((m: any) => {
          const isMeditationPlaying = isCurrentlyPlaying?.(m.id) ?? false;
          const currentProgress = getProgress?.(m.id) ?? 0;

          return (
            <div
              key={m.id ?? m.slug ?? m.title}
              className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 hover:bg-white/[0.06] transition cave-flicker"
            >
              {m.is_premium && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-primary/20 rounded-full">
                  <span className="text-xs font-medium text-primary">
                    {t("meditations.premium", "Premium")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onPlay(m)}
                  className="w-12 h-12 shrink-0 rounded-full bg-primary/20 flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isMeditationPlaying ? (
                    <Pause size={20} className="text-primary" />
                  ) : (
                    <Play size={20} className="text-primary ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">
                    <TranslatedText>{m.title ?? m.name}</TranslatedText>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {m.duration_minutes ?? Math.round((m.duration_seconds ?? 0) / 60)} min
                    </span>
                    {m.shc_reward != null && (
                      <span className="flex items-center gap-1">
                        <Sparkles size={12} className="text-accent" />
                        +{m.shc_reward} SHC
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isPlaying && isMeditationPlaying && (
                <div className="mt-3">
                  <Progress value={currentProgress} className="h-1" />
                </div>
              )}
            </div>
          );
        })}
          </div>
        </div>
      )}
    </div>
  );
}
