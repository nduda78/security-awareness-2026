"use client";

import { useState } from "react";

// Used only on the "New Challenge" form, before a challenge has an id to
// upload assets against immediately (see AssetUploader.tsx for the
// edit-existing-challenge version, which uploads right away with a real
// progress bar). This one's file gets submitted together with the rest
// of the challenge form on Save - there's no independent upload to show
// progress for yet, so this just confirms a file was actually selected
// and is queued to go out with the form, instead of silently trusting the
// browser's own tiny "no file chosen" text.
export function ChallengeFileField({
  label,
  name,
  removeName,
  currentUrl,
  hasCurrent,
  accept,
  hint,
}: {
  label: string;
  name: string;
  removeName: string;
  currentUrl?: string;
  hasCurrent?: boolean;
  accept: string;
  hint?: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      {hasCurrent && currentUrl && (
        <div className="mb-2 flex items-center gap-3">
          {accept === "audio/*" ? (
            <audio controls src={currentUrl} className="h-8 max-w-[220px]" />
          ) : accept === "video/*" ? (
            <video controls src={currentUrl} className="h-24 w-auto rounded-lg border border-brand-sand/10 object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
            <img src={currentUrl} alt="" className="h-16 w-auto rounded-lg border border-brand-sand/10 object-contain" />
          )}
          <label className="flex items-center gap-1.5 text-xs text-brand-sand/50">
            <input type="checkbox" name={removeName} className="accent-brand-red" />
            Remove current
          </label>
        </div>
      )}
      <div className="flex items-center gap-2.5">
        <label className="btn-secondary cursor-pointer !text-[11px]">
          Upload File
          <input
            name={name}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        {fileName && (
          <span className="text-[11px] text-brand-light-green">✓ {fileName} — will upload when you save</span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-brand-sand/35">{hint}</p>}
    </div>
  );
}
