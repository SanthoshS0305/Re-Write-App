"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "rw_intro_text";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState(text);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const prev = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.setItem(STORAGE_KEY, text);

    if (!prev || prev === text) {
      setDisplayed(text);
      return;
    }

    let cancelled = false;

    (async () => {
      // Show what was there before, then delete it
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

    return () => { cancelled = true; };
  }, [text]);

  return <span>{displayed}</span>;
}
