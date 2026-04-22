import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/setup";
import { I18nProvider } from "./i18n/I18nProvider";

// Auto-update: reload when a new service worker takes control (debounced — avoids reload storms).
// Lovable / preview hosts: unregister SW so editor + preview pages stay stable (no update loops).
if ("serviceWorker" in navigator) {
  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.endsWith(".lovable.app") ||
    host === "lovable.app";

  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  } else {
    const SW_RELOAD_KEY = "sw-last-auto-reload-ms";
    const reloadAfterUpdate = () => {
      const now = Date.now();
      const last = Number(sessionStorage.getItem(SW_RELOAD_KEY) || "0");
      if (now - last < 12_000) return;
      sessionStorage.setItem(SW_RELOAD_KEY, String(now));
      window.location.reload();
    };

    // Single listener: controllerchange covers skipWaiting / new worker activation.
    navigator.serviceWorker.addEventListener("controllerchange", reloadAfterUpdate);
  }
}

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);