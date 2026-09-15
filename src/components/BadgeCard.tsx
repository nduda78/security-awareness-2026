"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { burstConfetti } from "./confetti";
import type { ClientAgentCard } from "@/lib/client-types";
import { XpCountUp } from "./XpCountUp";

function PersonSilhouette({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5v1H4v-1z" />
    </svg>
  );
}

export function BadgeCard({ card, dimmed = false }: { card: ClientAgentCard; dimmed?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isRogue = card.tierKey === "ROGUE";

  const outline = card.outlineColor ?? card.tierColor;
  const icon = card.iconOverride ?? card.tierIcon;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
  }
  function handleMouseLeave() {
    const el = cardRef.current;
    if (el) el.style.transform = "rotateY(0deg) rotateX(0deg)";
  }

  function handleFlip(e: React.MouseEvent) {
    const next = !flipped;
    setFlipped(next);
    if (next && (card.tierKey === "TOP_SECRET" || isRogue)) {
      burstConfetti(e.clientX, e.clientY);
    }
  }

  return (
    <div
      id={`badge-${card.email.replace(/[^a-z0-9]/gi, "-")}`}
      data-name={card.displayName.toLowerCase()}
      className={`mx-auto w-full max-w-[420px] transition-opacity duration-300 ${dimmed ? "opacity-25" : "opacity-100"}`}
    >
      {/* Lanyard eyelet */}
      <div className="relative z-10 mx-auto h-3 w-8 -mb-1.5">
        <div className="absolute inset-x-0 top-0 mx-auto h-3 w-8 rounded-t-full border border-black/40 bg-[#111]" />
        <div className="absolute left-1/2 top-[3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black/70" />
      </div>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlip}
        className={`tilt-card badge-security-pattern relative aspect-[1.6/1] w-full cursor-pointer overflow-hidden rounded-xl border-[3px] shadow-lg shadow-black/40 ${
          isRogue ? "rogue-flicker" : ""
        } ${card.borderStyle ? `border-fx-${card.borderStyle}` : ""}`}
        style={{
          borderColor: outline,
          backgroundColor: card.backgroundColor ?? "#0a2b20",
          // @ts-expect-error custom property for pulse animation color
          "--pulse-color": outline,
        }}
      >
        {card.backgroundEffect && (
          <div className={`absolute inset-0 overflow-hidden pointer-events-none fx-${card.backgroundEffect}`} />
        )}
        {isRogue && <div className="process420-watermark overflow-hidden">PROCESS_420</div>}

        {card.ribbonText && (
          <div
            title={card.ribbonText}
            className={`absolute right-1.5 top-6 z-20 max-w-[42%] truncate rounded px-1.5 py-0.5 text-[8px] font-terminal uppercase shadow-lg ${
              card.ribbonRecognized
                ? "bg-brand-yellow text-brand-dark-green"
                : "bg-brand-purple text-brand-sand"
            }`}
          >
            {card.ribbonText}
          </div>
        )}

        {!flipped ? (
          <div className="relative z-10 flex h-full flex-col">
            {/* header strip */}
            <div
              className="flex items-center justify-between px-3 py-1"
              style={{ background: outline, color: "#0a2b20" }}
            >
              <div className="flex items-center gap-1 font-terminal text-[8px] font-bold uppercase tracking-widest">
                <Icon name="shield" className="h-3 w-3" />
                Dutchie Security
              </div>
              <div className={`font-terminal text-[8px] font-bold uppercase tracking-wide ${isRogue ? "glitch-text" : ""}`}>
                {card.tierLabel} clearance
              </div>
            </div>

            {/* body */}
            <div className="flex flex-1 gap-2.5 px-3 py-2">
              {/* photo box */}
              <div className="flex w-[74px] shrink-0 flex-col items-center gap-1">
                <div
                  className="relative flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded border-2 bg-black/40"
                  style={{ borderColor: outline }}
                >
                  {card.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
                    <img src={card.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PersonSilhouette className="h-10 w-10 text-brand-sand/30" />
                  )}
                  <Icon
                    name={icon}
                    className="absolute h-4 w-4 translate-x-6 translate-y-6 rounded-full bg-black/70 p-0.5"
                    style={{ color: outline }}
                  />
                </div>
                <div className="font-terminal text-[7px] tracking-wide text-brand-sand/50">{card.agentId}</div>
              </div>

              {/* details */}
              <div className="flex min-w-0 flex-1 flex-col justify-between rounded bg-black/30 px-1.5 py-1">
                <div className="min-w-0">
                  <div className={`truncate text-[15px] font-bold leading-tight ${isRogue ? "glitch-text" : ""}`}>
                    {card.renderedName}
                  </div>
                  <div className="truncate font-terminal text-[10px] italic text-brand-sand/70">
                    &ldquo;{card.motto ?? card.codename}&rdquo;
                  </div>
                  {card.clearanceIssuedLabel && (
                    <div className="mt-1 font-terminal text-[7px] uppercase tracking-wide text-brand-sand/40">
                      Issued {card.clearanceIssuedLabel}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between font-terminal text-[9px]">
                    <span className="text-brand-sand/50 uppercase">XP Level</span>
                    <span className="font-bold" style={{ color: outline }}>
                      <XpCountUp value={card.xp} />
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${card.progressPct}%`, background: outline }}
                    />
                  </div>
                  <div className="mt-0.5 truncate font-terminal text-[7px] text-brand-sand/40">
                    {card.xpToNext !== null ? `${card.xpToNext} XP to ${card.nextTierLabel}` : "Max clearance reached"}
                  </div>
                </div>
              </div>

              {/* side barcode strip */}
              <div className="flex w-6 shrink-0 flex-col items-center justify-between rounded bg-black/25 py-1">
                {card.achievements.length > 0 && (
                  <div className="flex flex-col items-center gap-0.5">
                    {card.achievements.slice(0, 3).map((a, i) => (
                      <Icon key={i} name="trophy" className="h-3 w-3 text-brand-yellow" />
                    ))}
                  </div>
                )}
                <div
                  className="font-terminal text-[9px] leading-[0.55rem] tracking-[0.15em] text-brand-sand/60 [writing-mode:vertical-rl]"
                >
                  {card.barcode}
                </div>
              </div>
            </div>

            {/* hologram / mag strip footer */}
            <div className="relative h-3 overflow-hidden border-t border-black/30">
              <div className="fx-holo absolute inset-0" />
              <div className="absolute inset-0 flex items-center justify-center font-terminal text-[6px] uppercase tracking-[0.2em] text-black/50">
                void if duplicated · dutchie security
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex h-full flex-col">
            <div className="h-7 w-full bg-black/80" />
            <div className="flex flex-1 flex-col justify-between px-4 py-2">
              <div>
                <div className="font-terminal text-[7px] uppercase tracking-widest text-brand-sand/40">
                  Authorized Signature
                </div>
                <div className="mt-0.5 truncate font-serif text-lg italic text-brand-sand/90">{card.codename}</div>
              </div>
              <div className="font-terminal text-[9px] text-brand-sand/70">
                <div>
                  AGENT ID <span className="text-brand-sand">{card.agentId}</span>
                </div>
                <div>
                  RANK <span className="text-brand-sand">#{card.rankInTier}</span> of {card.totalInTier} in{" "}
                  {card.tierLabel}
                </div>
                <div className="mt-1 tracking-[0.2em] text-brand-sand/50">{card.barcode}</div>
              </div>
              <div className="font-terminal text-[6px] leading-tight text-brand-sand/30">
                PROPERTY OF DUTCHIE SECURITY. IF FOUND, RETURN TO THE SECURITY DESK. UNAUTHORIZED DUPLICATION
                PROHIBITED.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between font-terminal text-[10px] uppercase text-brand-sand/40">
        <span>{card.funFact}</span>
      </div>
      <Link
        href={`/profile/${encodeURIComponent(card.email)}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 block font-terminal text-[10px] uppercase text-brand-sand/40 hover:text-brand-sand"
      >
        view full profile →
      </Link>
    </div>
  );
}
