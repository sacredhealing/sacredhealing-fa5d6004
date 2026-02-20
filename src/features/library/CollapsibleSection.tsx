import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-6 rounded-2xl border border-border/50 bg-card/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-muted/30 transition rounded-2xl"
      >
        <div className="text-left">
          <div className="text-foreground font-bold text-lg">{title}</div>
          {subtitle ? (
            <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
          ) : null}
        </div>
        {open ? <ChevronUp className="text-muted-foreground h-5 w-5" /> : <ChevronDown className="text-muted-foreground h-5 w-5" />}
      </button>

      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}
