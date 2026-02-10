// src/i18n/useT.ts
import { useContext } from "react";
import { I18nContext } from "./I18nProvider";

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within <I18nProvider>");
  remindNoRawStringsInThisHookDevOnly();
  return ctx;
}

// Optional: tiny dev reminder without spamming
function remindNoRawStringsInThisHookDevOnly() {
  if (process.env.NODE_ENV === "production") return;
}

