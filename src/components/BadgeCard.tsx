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

// Codenames are stored/displayed in ALL CAPS everywhere else ("SEALED
// STRAIN") for the terminal/stencil look, but a script signature font
// relies on lowercase glyphs to join up — forcing it to all-caps renders
// as disconnected block letters instead of a flowing signature.
function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function CardFront({
  card,
  outline,
  icon,
  isRogue,
  large = false,
}: {
  card: ClientAgentCard;
  outline: string;
  icon: string;
  isRogue: boolean;
  large?: boolean;
}) {
  const photoSize = large ? 148 : 82;

  // In the spotlight, animate the XP bar filling up from empty rather than
  // just appearing already full — the small grid card keeps its static bar.
  const [barPct, setBarPct] = useState(large ? 0 : card.progressPct);
  useEffect(() => {
    if (!large) return;
    const t = setTimeout(() => setBarPct(card.progressPct), 150);
    return () => clearTimeout(t);
  }, [large, card.progressPct]);

  return (
    <div className={`relative z-10 flex h-full flex-col ${large ? "p-6" : "p-3.5"}`}>
      {/* header */}
      <div className={`flex items-center justify-between gap-2 ${large ? "mb-5" : "mb-3"}`}>
        <div className="min-w-0 flex-1">
          {card.ribbonText && (
            <div
              title={card.ribbonText}
              className={`inline-block max-w-full truncate rounded-full font-terminal font-semibold uppercase shadow-lg ${
                large ? "px-4 py-1.5 text-xs" : "px-2.5 py-1 text-[9px]"
              } ${card.ribbonRecognized ? "bg-brand-yellow/90 text-brand-dark-green" : "bg-brand-purple/85 text-brand-sand"}`}
            >
              {card.ribbonText}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div
            className={`shrink-0 rounded-full font-terminal font-bold uppercase tracking-wide ring-1 ${
              large ? "px-3.5 py-1.5 text-xs" : "px-2.5 py-1 text-[9px]"
            } ${isRogue ? "glitch-text" : ""}`}
            style={{
              color: outline,
              background: glow(outline, 16),
              boxShadow: `inset 0 0 0 1px ${glow(outline, 35)}`,
            }}
          >
            {card.tierLabel}
          </div>
          {card.psaGrade && (
            <div
              title="Graded slab - Gem MT 10"
              className={`psa-grade-chip shrink-0 rounded-full font-terminal font-bold uppercase tracking-wide ${
                large ? "px-3.5 py-1.5 text-xs" : "px-2.5 py-1 text-[9px]"
              }`}
            >
              Gem MT 10
            </div>
          )}
        </div>
      </div>

      {/* body */}
      <div className={`flex min-h-0 flex-1 ${large ? "gap-5" : "gap-3"}`}>
        {/* photo box */}
        <div className={`flex shrink-0 flex-col items-center ${large ? "w-[148px] gap-2.5" : "w-[82px] gap-1.5"}`}>
          <div
            className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-black/35"
            style={{
              width: photoSize,
              height: photoSize,
              boxShadow: `0 8px 20px -8px ${glow(outline, 55)}, 0 0 0 2px ${glow(outline, 55)}, inset 0 0 0 1px rgba(255,255,255,0.06)`,
            }}
          >
            {card.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
              <img src={card.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <PersonSilhouette className={large ? "h-16 w-16 text-brand-sand/25" : "h-10 w-10 text-brand-sand/25"} />
            )}
            <div
              className={`absolute flex items-center justify-center rounded-full bg-black/70 ring-1 ring-white/15 ${
                large ? "bottom-1.5 right-1.5 h-8 w-8" : "bottom-1 right-1 h-5 w-5"
              }`}
              style={{ color: outline }}
            >
              <Icon name={icon} className={large ? "h-[18px] w-[18px]" : "h-3 w-3"} />
            </div>
          </div>
          <div
            className={`rounded-full bg-black/25 tracking-wide text-brand-sand/45 font-terminal ${
              large ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[9px]"
            }`}
          >
            {card.agentId}
          </div>
        </div>

        {/* details */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <div className="min-w-0">
            <div
              className={`truncate font-display font-semibold leading-tight text-brand-sand ${
                large ? "text-[34px]" : "text-[19px]"
              } ${isRogue ? "glitch-text" : ""}`}
            >
              {card.renderedName}
            </div>
            <div className={`truncate italic text-brand-sand/60 ${large ? "mt-1 text-lg" : "text-[12px]"}`}>
              &ldquo;{card.codename}&rdquo;
            </div>
            {card.clearanceIssuedLabel && (
              <div
                className={`uppercase tracking-wide text-brand-sand/35 font-terminal ${
                  large ? "mt-2.5 text-xs" : "mt-1.5 text-[9px]"
                }`}
              >
                Issued {card.clearanceIssuedLabel}
              </div>
            )}
            <div
              className={`truncate leading-snug text-brand-sand/50 ${
                large ? "mt-3 text-base" : "mt-1.5 text-[10.5px] text-brand-sand/45"
              }`}
              title={card.motto ?? card.funFact}
            >
              {card.motto ?? card.funFact}
            </div>
            {large && card.achievements.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {card.achievements.slice(0, 3).map((a, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-full bg-brand-yellow/10 px-2.5 py-1 text-sm font-medium text-brand-yellow ring-1 ring-brand-yellow/25"
                  >
                    <Icon name={a.icon} className="h-4 w-4" />
                    {a.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className={`flex items-baseline justify-between font-terminal ${large ? "text-base" : "text-[10px]"}`}>
              <span className="uppercase tracking-wide text-brand-sand/45">XP Level</span>
              <span className="font-bold" style={{ color: outline }}>
                <XpCountUp value={card.xp} />
              </span>
            </div>
            <div
              className={`w-full overflow-hidden rounded-full bg-black/35 ring-1 ring-white/5 ${large ? "mt-2 h-3" : "mt-1 h-2"}`}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${barPct}%`,
                  background: `linear-gradient(90deg, ${glow(outline, 70)}, ${outline})`,
                  boxShadow: `0 0 10px 0 ${glow(outline, 60)}`,
                }}
              />
            </div>
            <div className={`truncate font-terminal text-brand-sand/40 ${large ? "mt-1.5 text-sm" : "mt-1 text-[9px]"}`}>
              {card.xpToNext !== null ? `${card.xpToNext} XP to ${card.nextTierLabel}` : "Max clearance reached"}
            </div>
          </div>
        </div>

        {/* side strip: achievements + barcode */}
        <div
          className={`flex shrink-0 flex-col items-center justify-between rounded-xl bg-black/20 ring-1 ring-white/5 ${
            large ? "w-9 gap-2.5 py-2.5" : "w-6 gap-1.5 py-1.5"
          }`}
        >
          {card.achievements.length > 0 && (
            <div className={`flex flex-col items-center ${large ? "gap-2" : "gap-1"}`}>
              {card.achievements.slice(0, 3).map((a, i) => (
                <Icon
                  key={i}
                  name={a.icon}
                  className={large ? "h-[18px] w-[18px] text-brand-yellow" : "h-3 w-3 text-brand-yellow"}
                />
              ))}
            </div>
          )}
          {/* Decorative only — sliced short. Vertical writing-mode text has a
              surprisingly large intrinsic block-size (a full barcode string
              here measured ~210px tall), which was silently overflowing the
              fixed-height card and clipping the footer below it. */}
          <div
            className={`overflow-hidden font-terminal tracking-[0.15em] text-brand-sand/35 [writing-mode:vertical-rl] ${
              large ? "max-h-[130px] text-xs leading-[0.85rem]" : "max-h-[72px] text-[9px] leading-[0.55rem]"
            }`}
          >
            {card.barcode.slice(0, large ? 12 : 9)}
          </div>
        </div>
      </div>

      {/* holo footer strip */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 ${large ? "mt-5 h-3" : "mt-3 h-2"}`}
      >
        <div className="fx-holo absolute inset-0 opacity-60" />
      </div>
    </div>
  );
}

function CardBack({ card, large = false }: { card: ClientAgentCard; large?: boolean }) {
  return (
    <div className={`relative z-10 flex h-full flex-col ${large ? "p-7" : "p-4"}`}>
      <div
        className={`w-full rounded-full bg-gradient-to-r from-black/80 via-black/60 to-black/80 ring-1 ring-white/10 ${
          large ? "mb-5 h-9" : "mb-3 h-6"
        }`}
      />
      <div className="flex flex-1 flex-col">
        <div>
          <div className={`uppercase tracking-widest text-brand-sand/35 font-terminal ${large ? "text-sm" : "text-[9px]"}`}>
            Authorized Signature
          </div>
          <div
            className={`overflow-visible whitespace-nowrap font-script leading-[1.35] text-brand-sand/90 ${
              large ? "mt-2 py-1 text-4xl" : "mt-1 py-0.5 text-xl"
            }`}
          >
            {titleCase(card.codename)}
          </div>
        </div>
        <div className={`text-brand-sand/60 font-terminal ${large ? "mt-6 text-lg" : "mt-3 text-[11px]"}`}>
          <div>
            AGENT ID <span className="text-brand-sand">{card.agentId}</span>
          </div>
          <div>
            RANK <span className="text-brand-sand">#{card.rankInTier}</span> of {card.totalInTier} in{" "}
            {card.tierLabel}
          </div>
          <div className={`tracking-[0.2em] text-brand-sand/40 ${large ? "mt-3 text-sm" : "mt-1.5"}`}>{card.barcode}</div>
          {card.secretBackText && (
            <div
              className={`whitespace-pre-wrap rounded-md border border-dashed border-brand-yellow/40 bg-brand-yellow/5 font-terminal text-brand-sand/80 ${
                large ? "mt-4 px-4 py-3 text-base" : "mt-2.5 px-2.5 py-2 text-[10px]"
              }`}
            >
              <div className={`mb-1 uppercase tracking-widest text-brand-yellow/70 ${large ? "text-xs" : "text-[8px]"}`}>
                Classified Note
              </div>
              {card.secretBackText}
            </div>
          )}
        </div>
        <div className={`mt-auto leading-tight text-brand-sand/25 font-terminal ${large ? "pt-4 text-xs" : "pt-2 text-[7px]"}`}>
          PROPERTY OF DUTCHIE SECURITY. IF FOUND, RETURN TO THE SECURITY DESK.
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
  large?: boolean;
  /** Ref to just the front-face element - deliberately NOT the outer
   * flip-scene/flip-card wrapper, since that wrapper stacks the front and
   * back faces with a 3D rotateY transform + backface-visibility, which
   * DOM-snapshot libraries (html-to-image, html2canvas) don't render the
   * same way a real browser compositor does - capturing it directly
   * grabbed the mirrored back face instead of the front. */
  frontFaceRef?: React.Ref<HTMLDivElement>;
}

/** Derives the outline/icon/isRogue visual props shared by BadgeCard and any standalone CardVisual usage (e.g. the admin flare back-face preview). */
export function deriveBadgeVisualProps(card: ClientAgentCard) {
  return {
    isRogue: card.tierKey === "ROGUE",
    outline: card.outlineColor ?? card.tierColor,
    icon: card.iconOverride ?? card.tierIcon,
  };
}

export function CardVisual({
  card,
  outline,
  icon,
  isRogue,
  flipped,
  onClick,
  tiltEnabled = true,
  large = false,
  frontFaceRef,
}: CardVisualProps) {
  const outerRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = outerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (tiltEnabled) {
      el.style.transform = `rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
    }
    // Drives the holo-sheen overlay's cursor-tracking glint, regardless of
    // tiltEnabled - a static preview (tilt disabled) still benefits from
    // the sheen reacting to the cursor even without the 3D tilt.
    if (card.holoSheen) {
      el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
      el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
    }
  }
  function handleMouseLeave() {
    const el = outerRef.current;
    if (!el) return;
    el.style.transform = "rotateY(0deg) rotateX(0deg)";
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
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
      className={`flip-scene tilt-card relative aspect-[27/17] w-full ${tiltEnabled ? "cursor-pointer" : ""}`}
      style={{
        // @ts-expect-error custom properties for pulse animation color + holo-sheen cursor position
        "--pulse-color": outline,
        "--mx": "50%",
        "--my": "50%",
      }}
    >
      <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>
        {/* front face */}
        <div
          ref={frontFaceRef}
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
          {card.holoSheen && <div className="holo-sheen-layer absolute inset-0 overflow-hidden" />}
          {card.psaGrade && <div className="psa-slab-sheen absolute inset-0 overflow-hidden pointer-events-none" />}
          {isRogue && <div className="process420-watermark overflow-hidden">PROCESS_420</div>}
          <CardFront card={card} outline={outline} icon={icon} isRogue={isRogue} large={large} />
        </div>

        {/* back face */}
        <div
          className={`flip-face flip-face-back overflow-hidden rounded-[1.4rem] border backdrop-blur-xl ${
            isRogue ? "rogue-flicker" : ""
          }`}
          style={faceStyle}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
          {card.psaGrade && <div className="psa-slab-sheen absolute inset-0 overflow-hidden pointer-events-none" />}
          {isRogue && <div className="process420-watermark overflow-hidden">PROCESS_420</div>}
          <CardBack card={card} large={large} />
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
        <CardVisual
          card={card}
          outline={outline}
          icon={icon}
          isRogue={isRogue}
          flipped={flipped}
          onClick={handleCardClick}
          large
        />
        <p className="mt-4 text-center font-terminal text-[11px] uppercase tracking-wide text-brand-sand/40">
          Click the badge to flip · Esc or click outside to close
        </p>
      </div>
    </div>,
    document.body
  );
}

export function BadgeCard({
  card,
  dimmed = false,
  showProfileLink = true,
  frontCaptureRef,
}: {
  card: ClientAgentCard;
  dimmed?: boolean;
  showProfileLink?: boolean;
  /** Forwarded straight through to CardVisual's frontFaceRef - used by
   * DownloadBadgeButton to screenshot exactly the front-face card art. */
  frontCaptureRef?: React.Ref<HTMLDivElement>;
}) {
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const { isRogue, outline, icon } = deriveBadgeVisualProps(card);

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
        frontFaceRef={frontCaptureRef}
      />

      {showProfileLink && (
        <Link
          href={`/profile/${encodeURIComponent(card.email)}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 block font-terminal text-[10px] uppercase tracking-wide text-brand-sand/35 hover:text-brand-sand"
        >
          View Agents Profile →
        </Link>
      )}

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
