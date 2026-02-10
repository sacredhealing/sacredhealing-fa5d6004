import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sh_last_session";
const CUSTOM_EVENT = "sh_last_session_updated";

function getSnapshot(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "start";

    const data = JSON.parse(raw);
    const ts = typeof data.ts === 'number' ? data.ts : data.ts;
    const hours = (Date.now() - ts) / 1000 / 60 / 60;

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
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CUSTOM_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CUSTOM_EVENT, onCustom);
  };
}

export type PresenceState = "start" | "returned" | "deep";

export function usePresenceState(): PresenceState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as PresenceState;
}
