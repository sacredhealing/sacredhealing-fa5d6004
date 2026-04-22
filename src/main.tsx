import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/setup";
import { I18nProvider } from "./i18n/I18nProvider";
import { registerSW } from "virtual:pwa-register";

// PWA: never auto-reload the tab. Lovable / preview / iframe: unregister so nothing re-registers and fights the editor.
if ("serviceWorker" in navigator) {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const disableServiceWorker =
    isInIframe ||
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.endsWith(".lovable.app") ||
    host === "lovable.app" ||
    host.includes("lovable.dev");

  if (disableServiceWorker) {
    void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
  } else {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        /* New build available — user can refresh when ready; do not interrupt work. */
      },
      onOfflineReady() {
        /* App cached for offline */
      },
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);