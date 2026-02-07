import React from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function SectionCollapse({ title, description, defaultOpen = false, children }: Props) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      <summary className="list-none cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-foreground">{title}</div>
          {description ? (
            <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
          ) : null}
        </div>
        <span className="shrink-0 inline-flex transition-transform duration-200 [details[open]_&]:rotate-180">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </span>
      </summary>

      <div className="px-5 pb-5 pt-2 border-t border-border/50">
        {children}
      </div>
    </details>
  );
}
