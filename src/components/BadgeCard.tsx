"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function glow(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

function CardFront({ card, outline, icon, isRogue }: { card: ClientAgentCard; outline: string; icon: string; isRogue: boolean }) {
  return (
    <div className="relative z-10 flex h-full flex-col p-3.5">
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 font-terminal text-[9px] font-semibold uppercase tracking-widest text-brand-sand/70 ring-1 ring-white/10">
          <Icon name="shield" className="h-3 w-3 opacity-70" />
          Dutchie Security
        </div>
        <div
          className={`rounded-full px-2.5 py-1 font-terminal text-[9px] font-bold uppercase tracking-wide ring-1 ${isRogue ? "glitch-text" : ""}`}
          style={{
            color: outline,
            background: glow(outline, 16),
            boxShadow: `inset 0 0 0 1px ${glow(outline, 35)}`,
          }}
        >
          {card.tierLabel}
        </div>
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* photo box */}
        <div className="flex w-[82px] shrink-0 flex-col items-center gap-1.5">
          <div
            className="relative flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-2xl bg-black/35"
            style={{
              boxShadow: `0 8px 20px -8px ${glow(outline, 55)}, 0 0 0 2px ${glow(outline, 55)}, inset 0 0 0 1px rgba(255,255,255,0.06)`,
            }}
          >
            {card.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
              <img src={card.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <PersonSilhouette className="h-10 w-10 text-brand-sand/25" />
            )}
            <div
              className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 ring-1 ring-white/15"
              style={{ color: outline }}
            >
              <Icon name={icon} className="h-3 w-3" />
            </div>
          </div>
          <div className="rounded-full bg-black/25 px-2 py-0.5 font-terminal text-[9px] tracking-wide text-brand-sand/45">
            {card.agentId}
          </div>
        </div>

        {/* details */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="min-w-0">
            <div className={`truncate font-display text-[19px] font-semibold leading-tight text-brand-sand ${isRogue ? "glitch-text" : ""}`}>
              {card.renderedName}
            </div>
            <div className="truncate text-[12px] italic text-brand-sand/60">
              &ldquo;{card.motto ?? card.codename}&rdquo;
            </div>
            {card.clearanceIssuedLabel && (
              <div className="mt-1.5 font-terminal text-[9px] uppercase tracking-wide text-brand-sand/35">
                Issued {card.clearanceIssuedLabel}
              </div>
            )}
            <div className="mt-1.5 line-clamp-2 text-[10.5px] leading-snug text-brand-sand/45">{card.funFact}</div>
          </div>

          <div>
            <div className="flex items-baseline justify-between font-terminal text-[10px]">
              <span className="uppercase tracking-wide text-brand-sand/45">XP Level</span>
              <span className="font-bold" style={{ color: outline }}>
                <XpCountUp value={card.xp} />
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/35 ring-1 ring-white/5">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${card.progressPct}%`,
                  background: `linear-gradient(90deg, ${glow(outline, 70)}, ${outline})`,
                  boxShadow: `0 0 10px 0 ${glow(outline, 60)}`,
                }}
              />
            </div>
            <div className="mt-1 truncate font-terminal text-[9px] text-brand-sand/40">
              {card.xpToNext !== null ? `${card.xpToNext} XP to ${card.nextTierLabel}` : "Max clearance reached"}
            </div>
          </div>
        </div>

        {/* side strip: achievements + barcode */}
        <div className="flex w-6 shrink-0 flex-col items-center justify-between gap-1.5 rounded-xl bg-black/20 py-1.5 ring-1 ring-white/5">
          {card.achievements.length > 0 && (
            <div className="flex flex-col items-center gap-1">
              {card.achievements.slice(0, 3).map((a, i) => (
                <Icon key={i} name="trophy" className="h-3 w-3 text-brand-yellow" />
              ))}
            </div>
          )}
          {/* Decorative only — sliced short. Vertical writing-mode text has a
              surprisingly large intrinsic block-size (a full barcode string
              here measured ~210px tall), which was silently overflowing the
              fixed-height card and clipping the footer below it. */}
          <div className="max-h-[72px] overflow-hidden font-terminal text-[9px] leading-[0.55rem] tracking-[0.15em] text-brand-sand/35 [writing-mode:vertical-rl]">
            {card.barcode.slice(0, 9)}
          </div>
        </div>
      </div>

      {/* holo footer strip */}
      <div className="relative mt-3 h-2 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
        <div className="fx-holo absolute inset-0 opacity-60" />
      </div>
    </div>
  );
}

function CardBack({ card }: { card: ClientAgentCard }) {
  return (
    <div className="relative z-10 flex h-full flex-col p-4">
      <div className="mb-3 h-6 w-full rounded-full bg-gradient-to-r from-black/80 via-black/60 to-black/80 ring-1 ring-white/10" />
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="font-terminal text-[9px] uppercase tracking-widest text-brand-sand/35">
            Authorized Signature
          </div>
          <div className="mt-1 truncate font-serif text-xl italic text-brand-sand/90">{card.codename}</div>
        </div>
        <div className="font-terminal text-[11px] text-brand-sand/60">
          <div>
            AGENT ID <span className="text-brand-sand">{card.agentId}</span>
          </div>
          <div>
            RANK <span className="text-brand-sand">#{card.rankInTier}</span> of {card.totalInTier} in{" "}
            {card.tierLabel}
          </div>
          <div className="mt-1.5 tracking-[0.2em] text-brand-sand/40">{card.barcode}</div>
        </div>
        <div className="font-terminal text-[7px] leading-tight text-brand-sand/25">
          PROPERTY OF DUTCHIE SECURITY. IF FOUND, RETURN TO THE SECURITY DESK. UNAUTHORIZED DUPLICATION PROHIBITED.
        </div>
      </div>
    </div>
  );
}

interface CardVisualProps {
  card: ClientAgentCard;
  outline: string;
  icon: string;
  isRogue: boolean;
  flipped: boolean;
  onClick: (e: React.MouseEvent) => void;
  tiltEnabled?: boolean;
}

function CardVisual({ card, outline, icon, isRogue, flipped, onClick, tiltEnabled = true }: CardVisualProps) {
  const outerRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!tiltEnabled) return;
    const el = outerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
  }
  function handleMouseLeave() {
    const el = outerRef.current;
    if (el) el.style.transform = "rotateY(0deg) rotateX(0deg)";
  }

  const faceStyle: React.CSSProperties = {
    borderColor: glow(outline, 45),
    background: card.backgroundColor
      ? card.backgroundColor
      : `linear-gradient(155deg, ${glow(outline, 16)}, rgba(4,32,23,0.9) 55%, rgba(4,32,23,0.96))`,
    boxShadow: `0 20px 50px -18px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 46px -14px ${glow(outline, 40)}`,
  };

  return (
    <div
      ref={outerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="flip-scene tilt-card relative aspect-[1.42/1] w-full cursor-pointer"
      style={{
        // @ts-expect-error custom property for pulse animation color
        "--pulse-color": outline,
      }}
    >
      <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>
        {/* front face */}
        <div
          className={`flip-face overflow-hidden rounded-[1.4rem] border backdrop-blur-xl ${
            isRogue ? "rogue-flicker" : ""
          } ${card.borderStyle ? `border-fx-${card.borderStyle}` : ""}`}
          style={faceStyle}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
          <div
            className="pointer-events-none absolute -inset-x-10 -top-16 h-32 rotate-[8deg] opacity-30 blur-sm"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)" }}
          />
          {card.backgroundEffect && (
            <div className={`absolute inset-0 overflow-hidden pointer-events-none fx-${card.backgroundEffect}`} />
          )}
          {isRogue && <div className="process420-watermark overflow-hidden">PROCESS_420</div>}
          {card.ribbonText && (
            <div
              title={card.ribbonText}
              className={`absolute right-3 top-3 z-20 max-w-[42%] truncate rounded-full px-2.5 py-1 text-[9px] font-terminal font-semibold uppercase shadow-lg backdrop-blur-sm ${
                card.ribbonRecognized ? "bg-brand-yellow/90 text-brand-dark-green" : "bg-brand-purple/85 text-brand-sand"
              }`}
            >
              {card.ribbonText}
            </div>
          )}
          <CardFront card={card} outline={outline} icon={icon} isRogue={isRogue} />
        </div>

        {/* back face */}
        <div
          className={`flip-face flip-face-back overflow-hidden rounded-[1.4rem] border backdrop-blur-xl ${
            isRogue ? "rogue-flicker" : ""
          }`}
          style={faceStyle}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
          {isRogue && <div className="process420-watermark overflow-hidden">PROCESS_420</div>}
          <CardBack card={card} />
        </div>
      </div>
    </div>
  );
}

function BadgeSpotlight({
  card,
  outline,
  icon,
  isRogue,
  onClose,
}: {
  card: ClientAgentCard;
  outline: string;
  icon: string;
  isRogue: boolean;
  onClose: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCardClick(e: React.MouseEvent) {
    const next = !flipped;
    setFlipped(next);
    if (next && (card.tierKey === "TOP_SECRET" || isRogue)) {
      burstConfetti(e.clientX, e.clientY);
    }
  }

  return createPortal(
    <div
      className="spotlight-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-sand/70 ring-1 ring-white/15 transition hover:bg-white/20 hover:text-brand-sand"
      >
        ✕
      </button>
      <div
        className="spotlight-card-in w-full max-w-[640px]"
        onClick={(e) => e.stopPropagation()}
      >
        <CardVisual card={card} outline={outline} icon={icon} isRogue={isRogue} flipped={flipped} onClick={handleCardClick} />
        <p className="mt-4 text-center font-terminal text-[11px] uppercase tracking-wide text-brand-sand/40">
          Click the badge to flip · Esc or click outside to close
        </p>
      </div>
    </div>,
    document.body
  );
}

export function BadgeCard({ card, dimmed = false }: { card: ClientAgentCard; dimmed?: boolean }) {
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const isRogue = card.tierKey === "ROGUE";
  const outline = card.outlineColor ?? card.tierColor;
  const icon = card.iconOverride ?? card.tierIcon;

  return (
    <div
      id={`badge-${card.email.replace(/[^a-z0-9]/gi, "-")}`}
      data-name={card.displayName.toLowerCase()}
      className={`mx-auto w-full max-w-[460px] transition-opacity duration-300 ${dimmed ? "opacity-25" : "opacity-100"}`}
    >
      {/* Lanyard eyelet */}
      <div className="relative z-10 mx-auto -mb-2 h-4 w-9">
        <div className="absolute inset-x-0 top-0 mx-auto h-4 w-9 rounded-t-full border border-white/15 bg-gradient-to-b from-white/20 to-black/40 shadow-inner" />
        <div className="absolute left-1/2 top-[4px] h-2 w-2 -translate-x-1/2 rounded-full bg-black/60" />
      </div>

      <CardVisual
        card={card}
        outline={outline}
        icon={icon}
        isRogue={isRogue}
        flipped={false}
        onClick={() => setSpotlightOpen(true)}
      />

      <Link
        href={`/profile/${encodeURIComponent(card.email)}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 block font-terminal text-[10px] uppercase tracking-wide text-brand-sand/35 hover:text-brand-sand"
      >
        View Agents Profile →
      </Link>

      {spotlightOpen && (
        <BadgeSpotlight
          card={card}
          outline={outline}
          icon={icon}
          isRogue={isRogue}
          onClose={() => setSpotlightOpen(false)}
        />
      )}
    </div>
  );
}
