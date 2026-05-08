import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// WARNING: This unregisters ALL Service Workers unconditionally and wipes
// every Cache Storage entry under this origin. Remove this block BEFORE
// registering any intentional Service Worker (PWA / offline / Workbox).
// Cleanup target: visitors with a leftover SW from an earlier deployment
// (e.g. the original Lovable template) that pre-cached self-hosted Inter
// font files. Safe no-op when no SW is registered.
// Safe to remove after ~30 days of production traffic. See removal reminder
// inside the block.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
    if (regs.length > 0 && "caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  });
  if (import.meta.env.DEV) {
    // Hard reminder so this block is not forgotten. Console-only, dev-only,
    // shipped to no end user. If you still see this past 2026-06-07,
    // delete the surrounding block and remove this warn.
    console.warn(
      "[main.tsx] Stale-SW cleanup block is still present. Remove after 2026-06-07."
    );
  }
}
