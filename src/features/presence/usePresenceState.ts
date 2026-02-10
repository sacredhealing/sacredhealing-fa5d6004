import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sh_last_session";

function getSnapshot(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "start";

    const data = JSON.parse(raw);
    const hours = (Date.now() - data.ts) / 1000 / 60 / 60;

    if (hours > 24) return "start";
    if (hours > 1) return "returned";
    return "deep";
  } catch {
    return "start";
  }
}

function subscribe(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export type PresenceState = "start" | "returned" | "deep";

export function usePresenceState(): PresenceState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as PresenceState;
}
