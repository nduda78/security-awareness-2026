"use client";

import { useState, type RefObject } from "react";

type Status = "idle" | "rendering" | "done" | "error";

// Renders whatever DOM node targetRef points at (the badge front-face
// card, see BadgeCard's frontCaptureRef) to a canvas via html2canvas and
// downloads it as a JPG. Purely client-side - no server round trip, no
// stored file, just a snapshot of what's already on screen.
export function DownloadBadgeButton({
  targetRef,
  fileNameBase,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  fileNameBase: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleDownload() {
    const node = targetRef.current;
    if (!node) return;
    setStatus("rendering");
    try {
      // html-to-image serializes the live DOM into an SVG <foreignObject>
      // and lets the browser itself rasterize it, rather than
      // reimplementing CSS parsing/rendering (as html2canvas does) - that
      // matters here because Tailwind v4 compiles opacity modifiers
      // (e.g. /50) to color-mix()/oklch(), which html2canvas's parser
      // can't read and which crashed the original implementation.
      const { toJpeg } = await import("html-to-image");
      // 2x scale for a crisp download regardless of the on-screen card size;
      // backgroundColor set explicitly since a JPG can't represent
      // transparency - falls back to the app's dark theme color.
      const dataUrl = await toJpeg(node, {
        pixelRatio: 2,
        backgroundColor: "#042017",
        quality: 0.95,
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileNameBase}-badge.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      console.error("Badge download failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleDownload}
        disabled={status === "rendering"}
        className="btn-secondary !text-[11px] disabled:cursor-wait disabled:opacity-60"
      >
        {status === "rendering" ? "Preparing…" : "Download Badge"}
      </button>
      {status === "done" && <p className="text-[11px] text-brand-light-green">Downloaded.</p>}
      {status === "error" && <p className="text-[11px] text-brand-red">Couldn&apos;t render that — try again?</p>}
    </div>
  );
}
