import { useSyncExternalStore } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "rewrite:dashboard-view";

function readStoredView(): ViewMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "list" ? "list" : "grid";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useViewPreference() {
  const view = useSyncExternalStore(
    subscribe,
    readStoredView,
    () => "grid" // server snapshot
  );

  const setView = (next: ViewMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (e.g. Safari private mode) — view just won't persist
    }
    window.dispatchEvent(new Event("storage")); // notify this tab's own subscribers; the native "storage" event only fires cross-tab
  };

  return { view, setView };
}
