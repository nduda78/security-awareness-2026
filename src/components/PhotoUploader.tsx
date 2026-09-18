"use client";

import { useRef, useState } from "react";

// Display frame is a fixed square; output canvas renders at 2x that for a
// reasonably crisp badge photo without needing a huge upload.
const FRAME = 220;
const OUTPUT = FRAME * 2;

interface Props {
  uploadAction: (formData: FormData) => void | Promise<void>;
  removeAction: () => void | Promise<void>;
  hasPhoto: boolean;
}

export function PhotoUploader({ uploadAction, removeAction, hasPhoto }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const imgElRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetCropState() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setNatural({ width: 0, height: 0 });
    setBaseScale(1);
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Unsupported file type — use JPG, PNG, WEBP, or GIF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("That file is too large to crop here — try something under 8MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setImgSrc(url);
    resetCropState();
  }

  function onImageLoad() {
    const img = imgElRef.current;
    if (!img) return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    // "cover" scale so the frame starts fully covered by the image.
    const base = Math.max(FRAME / nw, FRAME / nh);
    const w = nw * base;
    const h = nh * base;
    setNatural({ width: nw, height: nh });
    setBaseScale(base);
    setOffset({ x: (FRAME - w) / 2, y: (FRAME - h) / 2 });
  }

  function sizeAt(zoom: number) {
    return { width: natural.width * baseScale * zoom, height: natural.height * baseScale * zoom };
  }

  function clampOffset(x: number, y: number, w: number, h: number) {
    // Keep the image covering the frame at all times — no gaps at the edges.
    const minX = Math.min(0, FRAME - w);
    const minY = Math.min(0, FRAME - h);
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  }

  const displayed = sizeAt(scale);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const next = clampOffset(
      dragRef.current.origX + dx,
      dragRef.current.origY + dy,
      displayed.width,
      displayed.height
    );
    setOffset(next);
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function onZoomChange(next: number) {
    const oldSize = displayed;
    const newSize = sizeAt(next);
    // Keep the frame-center point fixed while zooming.
    const centerFracX = oldSize.width > 0 ? (FRAME / 2 - offset.x) / oldSize.width : 0.5;
    const centerFracY = oldSize.height > 0 ? (FRAME / 2 - offset.y) / oldSize.height : 0.5;
    const nextOffset = clampOffset(
      FRAME / 2 - centerFracX * newSize.width,
      FRAME / 2 - centerFracY * newSize.height,
      newSize.width,
      newSize.height
    );
    setScale(next);
    setOffset(nextOffset);
  }

  async function handleSave() {
    const img = imgElRef.current;
    if (!img) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported in this browser.");

      const factor = OUTPUT / FRAME;
      ctx.drawImage(img, offset.x * factor, offset.y * factor, displayed.width * factor, displayed.height * factor);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Could not process that image.");

      const formData = new FormData();
      formData.append("photo", new File([blob], "badge-photo.jpg", { type: "image/jpeg" }));
      await uploadAction(formData);
    } catch (err) {
      // The server action redirects on success, which Next.js implements by
      // throwing a special internal error for its own router to catch and
      // turn into navigation. Let that one through untouched instead of
      // showing it as a real error.
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        // Success — reset back to the plain upload view before Next's own
        // router takes over navigation, so we don't get stuck showing a
        // "Saving…" button across the redirect (this component instance
        // survives the soft navigation since the route itself doesn't
        // change, only its query string).
        if (imgSrc) URL.revokeObjectURL(imgSrc);
        setImgSrc(null);
        setBusy(false);
        throw err;
      }
      setError(err instanceof Error ? err.message : "Something went wrong cropping that image.");
      setBusy(false);
    }
  }

  function handleCancel() {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setImgSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (imgSrc) {
    return (
      <div>
        <div
          className="relative mx-auto overflow-hidden rounded border-2 border-brand-light-green bg-black/60 touch-none"
          style={{ width: FRAME, height: FRAME, cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL being live-cropped, not a static/remote asset */}
          <img
            ref={imgElRef}
            src={imgSrc}
            alt=""
            draggable={false}
            onLoad={onImageLoad}
            className="absolute select-none"
            style={{
              left: offset.x,
              top: offset.y,
              width: displayed.width || undefined,
              height: displayed.height || undefined,
              maxWidth: "none",
              maxHeight: "none",
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded border border-white/30" />
        </div>

        <div className="mx-auto mt-2 flex items-center gap-2" style={{ width: FRAME }}>
          <span className="font-terminal text-[9px] text-brand-sand/50">ZOOM</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>

        {error && <div className="mt-2 max-w-[220px] text-center text-[10px] text-brand-red">{error}</div>}

        <div className="mx-auto mt-2 flex gap-2" style={{ width: FRAME }}>
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="flex-1 rounded bg-brand-light-green px-2 py-1 font-terminal text-[10px] uppercase text-brand-dark-green disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Photo"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleCancel}
            className="flex-1 rounded border border-brand-sand/20 px-2 py-1 font-terminal text-[10px] uppercase text-brand-sand/60"
          >
            Cancel
          </button>
        </div>
        <p className="mt-2 text-center font-terminal text-[9px] text-brand-sand/30">
          Drag to reposition · use the slider to zoom
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="mb-2 rounded bg-brand-red/15 p-2 text-xs text-brand-red">{error}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <label className="btn-secondary cursor-pointer !text-[11px]">
          Upload Photo
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChosen}
            className="hidden"
          />
        </label>
      </div>
      {hasPhoto && (
        <form action={removeAction} className="mt-2">
          <button className="font-terminal text-[10px] uppercase text-brand-sand/40 hover:text-brand-red">
            Remove current photo
          </button>
        </form>
      )}
      <p className="mt-2 font-terminal text-[9px] text-brand-sand/30">
        JPG, PNG, WEBP, or GIF. You&apos;ll be able to crop it before saving.
      </p>
    </div>
  );
}
