import { linkifySegments } from "@/lib/text";

/** Renders `text` with any http(s) URLs turned into real clickable links (opens in a new tab). Plain server-renderable, no client hooks needed. */
export function Linkify({ text, className }: { text: string; className?: string }) {
  const segments = linkifySegments(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "link" ? (
          <a
            key={i}
            href={seg.value}
            target="_blank"
            rel="noopener noreferrer"
            className={`break-all text-brand-cyan underline decoration-dotted hover:text-brand-yellow ${className ?? ""}`}
          >
            {seg.value}
          </a>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </>
  );
}
