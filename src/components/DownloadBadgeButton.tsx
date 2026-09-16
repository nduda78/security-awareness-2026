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
      const html2canvas = (await import("html2canvas")).default;
      // 2x scale for a crisp download regardless of the on-screen card size;
      // backgroundColor set explicitly since the card's own background can
      // include transparency (e.g. no custom backgroundColor set), and a
      // JPG can't represent transparency - falls back to the app's dark
      // theme color instead of html2canvas's default white.
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#042017",
        useCORS: true,
      });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      if (!blob) throw new Error("Could not render the badge to an image.");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileNameBase}-badge.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
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
