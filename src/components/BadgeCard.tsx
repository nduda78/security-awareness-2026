"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { burstConfetti } from "./confetti";
import type { ClientAgentCard } from "@/lib/client-types";
import { XpCountUp } from "./XpCountUp";

const RING_RADIUS = 42;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

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
    el.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`;
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

  const offset = RING_CIRC - (card.progressPct / 100) * RING_CIRC;

  return (
    <div
      id={`badge-${card.email.replace(/[^a-z0-9]/gi, "-")}`}
      data-name={card.displayName.toLowerCase()}
      className={`transition-opacity duration-300 ${dimmed ? "opacity-25" : "opacity-100"}`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlip}
        className={`tilt-card relative cursor-pointer rounded-xl border-2 p-4 min-h-[300px] ${
          isRogue ? "rogue-flicker" : ""
        } ${card.borderStyle ? `border-fx-${card.borderStyle}` : ""}`}
        style={{
          borderColor: outline,
          background: card.backgroundColor ?? "rgba(4,32,23,0.7)",
          // @ts-expect-error custom property for pulse animation color
          "--pulse-color": outline,
        }}
      >
        {card.backgroundEffect && (
          <div className={`absolute inset-0 rounded-xl overflow-hidden pointer-events-none fx-${card.backgroundEffect}`} />
        )}
        {isRogue && (
          <div className="process420-watermark rounded-xl overflow-hidden">PROCESS_420</div>
        )}

        {card.ribbonText && (
          <div
            title={card.ribbonText}
            className={`absolute -right-2 -top-2 max-w-[65%] truncate rounded px-2 py-0.5 text-[9px] font-terminal uppercase shadow-lg ${
              card.ribbonRecognized
                ? "bg-brand-yellow text-brand-dark-green"
                : "bg-brand-purple text-brand-sand"
            }`}
          >
            {card.ribbonText}
          </div>
        )}

        {!flipped ? (
          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            <div className="relative h-24 w-24">
              <svg width="96" height="96" className="rotate-[-90deg]">
                <circle cx="48" cy="48" r={RING_RADIUS} fill="none" stroke="rgba(241,232,214,0.15)" strokeWidth="6" />
                <circle
                  cx="48"
                  cy="48"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={outline}
                  strokeWidth="6"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="xp-ring"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name={icon} className="h-9 w-9" style={{ color: outline } as React.CSSProperties} />
              </div>
            </div>

            <div className={isRogue ? "glitch-text" : ""}>
              <div className="text-lg font-semibold leading-tight">{card.renderedName}</div>
              <div className="font-terminal text-xs uppercase" style={{ color: outline }}>
                {card.tierLabel}
              </div>
            </div>

            <div className="font-terminal text-[13px] tracking-wide text-brand-sand/90">
              &ldquo;{card.motto ?? card.codename}&rdquo;
            </div>
            <div className="text-[11px] text-brand-sand/60 italic">{card.funFact}</div>

            <div className="font-terminal text-[11px] text-brand-sand/70">{card.agentId}</div>

            <div className="mt-1 w-full border-t border-brand-sand/15 pt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-sand/60">XP</span>
                <span className="font-terminal font-semibold">
                  <XpCountUp value={card.xp} />
                </span>
              </div>
              {card.xpToNext !== null ? (
                <div className="mt-0.5 text-brand-sand/60">
                  {card.xpToNext} XP to {card.nextTierLabel}
                </div>
              ) : (
                <div className="mt-0.5 text-brand-sand/60">Max clearance reached</div>
              )}
              {card.clearanceIssuedLabel && (
                <div className="mt-1 text-brand-sand/50">Clearance issued {card.clearanceIssuedLabel}</div>
              )}
            </div>

            {card.achievements.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {card.achievements.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-yellow/15 px-2 py-0.5 text-[10px] text-brand-yellow"
                  >
                    <Icon name="trophy" className="h-3 w-3" /> {a}
                  </span>
                ))}
              </div>
            )}

            <Link
              href={`/profile/${encodeURIComponent(card.email)}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 font-terminal text-[10px] uppercase text-brand-sand/40 hover:text-brand-sand"
            >
              view full profile →
            </Link>
          </div>
        ) : (
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="font-terminal text-[10px] uppercase text-brand-sand/50">Personnel File</div>
            <div className="text-xl font-bold">{card.codename}</div>
            <div className="font-terminal text-sm text-brand-sand/70">{card.agentId}</div>
            <div className="font-terminal text-2xl tracking-widest">{card.barcode}</div>
            <div className="text-sm">
              Ranked <span className="font-semibold">#{card.rankInTier}</span> of {card.totalInTier} in {card.tierLabel}
            </div>
            <div className="text-[11px] text-brand-sand/50">click to flip back</div>
          </div>
        )}
      </div>
    </div>
  );
}
