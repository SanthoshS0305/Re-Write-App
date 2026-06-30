"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "rw_intro_text";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// useLayoutEffect on client (synchronous before paint), useEffect on server (no-op for init)
const useSyncEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState(text);
  const [cursor, setCursor] = useState(false);

  // Set the correct starting text before the browser paints to avoid flash
  useSyncEffect(() => {
    const prev = sessionStorage.getItem(STORAGE_KEY);
    if (!prev) {
      setDisplayed("");
      setCursor(true);
    } else if (prev !== text) {
      setDisplayed(prev);
      setCursor(true);
    }
  }, []);

  useEffect(() => {
    const prev = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.setItem(STORAGE_KEY, text);

    let cancelled = false;

    if (!prev) {
      // First visit — type in from scratch
      (async () => {
        await sleep(250);
        for (let i = 0; i <= text.length; i++) {
          if (cancelled) return;
          setDisplayed(text.slice(0, i));
          await sleep(50);
        }
        await sleep(500);
        if (!cancelled) setCursor(false);
      })();
      return () => { cancelled = true; };
    }

    if (prev === text) return;

    // Navigation — backspace prev, type new
    (async () => {
      await sleep(60);
      for (let i = prev.length; i >= 0; i--) {
        if (cancelled) return;
        setDisplayed(prev.slice(0, i));
        await sleep(25);
      }
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        setDisplayed(text.slice(0, i));
        await sleep(50);
      }
      await sleep(500);
      if (!cancelled) setCursor(false);
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <span>{displayed}</span>
      {cursor && (
        <span className="animate-pulse" style={{ opacity: 0.8, marginLeft: 1 }}>|</span>
      )}
    </>
  );
}
