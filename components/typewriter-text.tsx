"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "rw_intro_text";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState(text);

  useEffect(() => {
    const prev = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.setItem(STORAGE_KEY, text);

    // Restore sessionStorage on cleanup so React Strict Mode's double-invoke
    // sees the correct previous value on the second run.
    const restore = () => {
      if (prev) sessionStorage.setItem(STORAGE_KEY, prev);
      else sessionStorage.removeItem(STORAGE_KEY);
    };

    if (!prev || prev === text) {
      setDisplayed(text);
      return restore;
    }

    let cancelled = false;

    (async () => {
      setDisplayed(prev);
      await sleep(80);

      for (let i = prev.length; i >= 0; i--) {
        if (cancelled) return;
        setDisplayed(prev.slice(0, i));
        await sleep(28);
      }
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        setDisplayed(text.slice(0, i));
        await sleep(48);
      }
    })();

    return () => {
      cancelled = true;
      restore();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <span>{displayed}</span>;
}
