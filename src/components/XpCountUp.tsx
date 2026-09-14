"use client";

import { useEffect, useRef, useState } from "react";

export function XpCountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.min(1, elapsed / durationMs);
      // ease-out
      const eased = 1 - Math.pow(1 - pct, 3);
      setDisplay(Math.round(eased * value));
      if (pct < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, durationMs]);

  return <span>{display} XP</span>;
}
