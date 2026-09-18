"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Any challenge image (question screenshots especially - phishing emails,
 * text messages, etc. often have small print that's hard to read at the
 * inline size) becomes click-to-enlarge: tapping it opens a full-screen
 * lightbox with the same modal conventions as the badge spotlight
 * (BadgeCard.tsx) - portal-rendered, ESC/click-outside/✕ to close, body
 * scroll locked while open - just showing the image at a much bigger size
 * instead of a badge.
 */
export function ZoomableImage({ src, alt = "", className }: { src: string; alt?: string; className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully */}
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className={`cursor-zoom-in transition hover:opacity-90 ${className ?? ""}`}
      />
      {open &&
        createPortal(
          <div
            className="spotlight-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-sand/70 ring-1 ring-white/15 transition hover:bg-white/20 hover:text-brand-sand"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              className="spotlight-card-in max-h-[90vh] max-w-[92vw] cursor-zoom-out rounded-2xl object-contain shadow-2xl"
            />
          </div>,
          document.body
        )}
    </>
  );
}
