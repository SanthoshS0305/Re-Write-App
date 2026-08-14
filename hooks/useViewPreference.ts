import { useEffect, useState } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "rewrite:dashboard-view";

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return "grid";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "list" ? "list" : "grid";
}

export function useViewPreference() {
  const [view, setViewState] = useState<ViewMode>("grid");

  useEffect(() => {
    setViewState(readStoredView());
  }, []);

  const setView = (next: ViewMode) => {
    setViewState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return { view, setView };
}
