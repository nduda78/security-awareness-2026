"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "uploading" | "done" | "error";

export function AssetUploader({
  challengeId,
  field,
  label,
  accept,
  currentUrl,
  hasCurrent: hasCurrentInitial,
  hint,
  kind,
}: {
  challengeId: string;
  field: "questionImage" | "unlockImage" | "unlockAudio" | "unlockVideo";
  label: string;
  accept: string;
  currentUrl: string;
  hasCurrent: boolean;
  hint?: string;
  kind: "image" | "audio" | "video";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasCurrent, setHasCurrent] = useState(hasCurrentInitial);
  const [cacheBust, setCacheBust] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStatus("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("challengeId", challengeId);
    formData.append("field", field);
    formData.append("file", file);

    // Uses XHR rather than fetch specifically to get real upload progress
    // events — fetch has no cross-browser way to observe request-body
    // upload progress, only response download progress.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/challenge-asset");
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("done");
        setHasCurrent(true);
        setCacheBust((n) => n + 1);
        router.refresh();
      } else {
        setStatus("error");
        try {
          setError(JSON.parse(xhr.responseText).error || "Upload failed.");
        } catch {
          setError("Upload failed.");
        }
      }
    };
    xhr.onerror = () => {
      setStatus("error");
      setError("Upload failed \u2014 connection dropped. Try again?");
    };
    xhr.send(formData);
  }

  async function onRemove() {
    setError(null);
    setStatus("uploading");
    try {
      const res = await fetch("/api/admin/challenge-asset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, field }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to remove.");
      setHasCurrent(false);
      setStatus("idle");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to remove.");
    }
  }

  const displayUrl = cacheBust ? `${currentUrl}?v=${cacheBust}` : currentUrl;

  return (
    <div>
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>

      {hasCurrent && (
        <div className="mb-2 flex items-center gap-3">
          {kind === "audio" ? (
            <audio controls src={displayUrl} className="h-8 max-w-[220px]" />
          ) : kind === "video" ? (
            <video controls src={displayUrl} className="h-24 w-auto rounded-lg border border-brand-sand/10 object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
            <img src={displayUrl} alt="" className="h-16 w-auto rounded-lg border border-brand-sand/10 object-contain" />
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={status === "uploading"}
            className="font-terminal text-xs uppercase text-brand-red hover:underline disabled:opacity-40"
          >
            Remove current
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={onFileChosen} className="text-xs text-brand-sand/70" />

      {status === "uploading" && (
        <div className="mt-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-brand-cyan transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-brand-cyan">Uploading… {progress}%</p>
        </div>
      )}
      {status === "done" && <p className="mt-1 text-[11px] text-brand-light-green">Uploaded.</p>}
      {status === "error" && error && <p className="mt-1 text-[11px] text-brand-red">{error}</p>}
      {hint && <p className="mt-1 text-[11px] text-brand-sand/35">{hint}</p>}
    </div>
  );
}
