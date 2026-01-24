import React from "react";

import { cn } from "@/lib/utils";

interface SacredHeroGeometryProps {
  className?: string;
}

export const SacredHeroGeometry: React.FC<SacredHeroGeometryProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("opacity-30 animate-spin-slow", className)}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary))" fill="none" strokeWidth="0.5" />
      <path d="M50 5 L95 95 L5 95 Z" stroke="hsl(var(--primary))" fill="none" strokeWidth="0.5" />
    </svg>
  );
};
