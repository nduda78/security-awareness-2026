"use client";

import { useEffect } from "react";

// Mounted only when the admin-controlled site-wide "compromised" theme is
// on (see settings.ts / admin/settings). The root layout already applies
// the .site-compromised class server-side (so there's no flash-of-normal-
// theme on first paint) - this component only handles the bits that need
// real JS: a periodic brief full-page glitch pulse (much softer than the
// existing process420 chaos-shake easter egg, which is intentionally
// intense but only ever lasts 3 seconds - this one runs indefinitely, so
// it has to stay usable, not seizure-inducing) plus rendering the
// scanline overlay and breach ticker markup.
export function VirusOverlay() {
  useEffect(() => {
    let cancelled = false;
    function scheduleNext() {
      const delay = 4000 + Math.random() * 5000; // every ~4-9s
      const t = setTimeout(() => {
        if (cancelled) return;
        document.documentElement.classList.add("glitch-pulse");
        setTimeout(() => {
          if (!cancelled) document.documentElement.classList.remove("glitch-pulse");
        }, 180);
        scheduleNext();
      }, delay);
      return t;
    }
    const timer = scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.documentElement.classList.remove("glitch-pulse");
    };
  }, []);

  return (
    <>
      <div className="virus-scanlines" aria-hidden="true" />
      <div className="virus-ticker" role="alert" aria-live="polite">
        <span>
          ⚠ UNAUTHORIZED ACCESS DETECTED &nbsp;·&nbsp; DUTCHIE SECURITY OFFLINE &nbsp;·&nbsp; SYSTEM COMPROMISED
          &nbsp;·&nbsp; ⚠ UNAUTHORIZED ACCESS DETECTED &nbsp;·&nbsp; DUTCHIE SECURITY OFFLINE &nbsp;·&nbsp; SYSTEM
          COMPROMISED &nbsp;·&nbsp;
        </span>
      </div>
    </>
  );
}
