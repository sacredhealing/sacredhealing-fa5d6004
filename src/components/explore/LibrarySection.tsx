import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export type LibraryItem = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

type LibrarySectionProps = {
  title: string;
  subtitle?: string;
  items: LibraryItem[];
  initialVisible?: number;
};

export function LibrarySection({
  title,
  subtitle,
  items,
  initialVisible = 4,
}: LibrarySectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > initialVisible;
  const visibleItems = expanded ? items : items.slice(0, initialVisible);

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h3 className="text-lg md:text-xl font-heading font-bold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleItems.map((item) => (
          <Link key={item.key} to={item.href} className="block">
            <Card className="rounded-2xl p-4 bg-card/50 border-border/50 hover:bg-muted/30 transition">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-foreground truncate">{item.title}</div>
                    {item.badge ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 shrink-0">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-muted-foreground hover:text-foreground gap-1"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t("explore.showLess", "Show less") : t("explore.showMore", "Show more")}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
