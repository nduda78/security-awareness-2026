import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TIERS } from "@/lib/tiers";
import type { IconKey } from "@/lib/flare";
import { isCompromisedModeEnabled } from "@/lib/settings";

function Section({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: IconKey | "chat";
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="surface-card scroll-mt-24 p-6">
      <h3 className="mb-3 flex items-center gap-2.5 font-display text-lg font-semibold text-brand-sand">
        <Icon name={icon} className="h-5 w-5 text-brand-yellow" />
        {title}
      </h3>
      {children}
    </div>
  );
}

const TOC: { id: string; label: string; corrupted: string }[] = [
  { id: "xp", label: "How XP Works", corrupted: "XP.EXE CORRUPTED" },
  { id: "clearance", label: "Clearance Tiers", corrupted: "ACCESS_LEVELS.LOG" },
  { id: "challenge-types", label: "Challenge Types", corrupted: "EXPLOIT_CATALOG" },
  { id: "badges-flare", label: "Badges & Flare", corrupted: "IDENTITY_SPOOFING" },
  { id: "chat-room", label: "Chat Room", corrupted: "COMMS_LEAK" },
  { id: "fair-play", label: "Fair Play", corrupted: "ANTI-TAMPER.CFG" },
];

// Every heading/paragraph/list item below has a "corrupted" hacker-flavor
// twin for the site-wide compromised theme (see VirusOverlay.tsx /
// settings.ts) - deliberately including the body prose this time, per an
// explicit "go all the way, even if it's less readable" call. The one
// thing deliberately NOT touched is the Clearance Tiers grid itself
// (t.label / t.icon / t.color, straight from TIERS) - those are the exact
// same values rendered on every badge, and the whole point of this theme
// is to leave badges/challenges alone.
export default async function RulesPage() {
  const compromised = await isCompromisedModeEnabled();
  const visibleTiers = [...TIERS].filter((t) => t.key !== "ROGUE").sort((a, b) => a.minXp - b.minXp);

  return (
    <div className="fade-in-up mx-auto max-w-3xl space-y-6">
      <div className="mb-4">
        <div className="section-eyebrow mb-2">{compromised ? "Intercepted Transmission" : "Briefing Document"}</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {compromised ? (
            <>
              System Breach &amp; <span className="gradient-text">Unknown Protocols</span>
            </>
          ) : (
            <>
              Rules &amp; <span className="gradient-text">How It Works</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-brand-sand/70">
          {compromised
            ? "TRANSMISSION INTERCEPTED — ORIGINAL BRIEFING OVERWRITTEN. Unknown party has rerouted the challenge feed through an unverified relay. XP totals may be forged. Clearance advancement can no longer be independently confirmed. Recommend disconnecting, but the button for that may also be compromised."
            : "All October, the Security team will drop new challenges — phishing quizzes, briefings, trivia, and more. Complete a challenge to earn XP. Earn enough XP and your security clearance advances. Higher clearance means bragging rights, a fancier badge, access to more challenges, and (maybe) some real prizes."}
        </p>
      </div>

      <nav aria-label="Table of contents" className="glass-panel rounded-2xl p-5">
        <div className="mb-3 font-terminal text-xs uppercase tracking-widest text-brand-cyan">
          {compromised ? "Directory Listing (unverified)" : "Contents"}
        </div>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {TOC.map((item, i) => (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-brand-sand/70 transition hover:bg-brand-sand/5 hover:text-brand-yellow"
              >
                <span className="font-terminal text-xs text-brand-sand/30 group-hover:text-brand-yellow">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {compromised ? item.corrupted : item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="xp" title={compromised ? "XP.EXE CORRUPTED" : "How XP Works"} icon="shield">
        <ul className="space-y-2.5 text-brand-sand/75">
          {(compromised
            ? [
                "XP ledger integrity: UNKNOWN. Values displayed may not reflect reality.",
                "Answers are now routed through an intermediary of unknown origin before reaching the server.",
                "'Correct' answers update your profile and the Leaderboard instantly — whether that reflects the truth is a separate question.",
                "Free-response submissions are queued for review by... someone. The Security team can no longer confirm it's them.",
              ]
            : [
                "Each XP challenge has its own XP value based on difficulty.",
                "Submit your answer through the challenge's in-app form.",
                "Correct answers award XP automatically and instantly update your profile and the Leaderboard.",
                "Some challenges are graded automatically; free-response ones are reviewed by the Security team before XP is awarded.",
              ]
          ).map((line, i) => (
            <li key={i} className="flex gap-2.5">
              <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light-green" />
              <span>{line}</span>
            </li>
          ))}
          <li className="flex gap-2.5">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
            <span>
              {compromised ? (
                <>
                  <strong className="text-brand-sand">Duplicate-submission lock: STATUS UNKNOWN.</strong>{" "}
                  Resubmitting a completed challenge returns a confirmation message of unverified origin. Extra XP
                  cannot be ruled out, but don&apos;t count on it.
                </>
              ) : (
                <>
                  <strong className="text-brand-sand">Each XP challenge can only be completed once per person.</strong>{" "}
                  Submitting a challenge you already completed won&apos;t earn extra XP, and you won&apos;t get a
                  right/wrong reveal immediately — just a confirmation that your answer was received.
                </>
              )}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
            <span>
              {compromised ? (
                <>
                  Retry allowance: unverifiable per-payload. Some let you keep trying, some don&apos;t — origin
                  of that setting is unclear. Once exhausted, a payload locks itself and says so.
                </>
              ) : (
                <>
                  <strong className="text-brand-sand">Some challenges allow more than one try.</strong> If a
                  challenge has a limited number of attempts, you&apos;ll see how many you have left right on the
                  page — and any challenge with room for a retry reveals right/wrong immediately (otherwise you
                  couldn&apos;t know to try again). Run out without getting it right and it locks for good, clearly
                  marked as out of attempts.
                </>
              )}
            </span>
          </li>
        </ul>
      </Section>

      <Section id="clearance" title={compromised ? "ACCESS_LEVELS.LOG" : "Clearance Tiers"} icon="crown">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {visibleTiers.map((t) => (
            <div
              key={t.key}
              className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition hover:-translate-y-0.5"
              style={{ borderColor: `${t.color}40`, background: `${t.color}0d` }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${t.color}22`, border: `1px solid ${t.color}55` }}
              >
                <Icon name={t.icon} className="h-6 w-6" style={{ color: t.color } as React.CSSProperties} />
              </div>
              <div className="font-terminal text-sm font-semibold uppercase tracking-wide" style={{ color: t.color }}>
                {t.label}
              </div>
              <div className="text-xs text-brand-sand/50">
                {t.minXp}
                {t.maxXp !== null ? `–${t.maxXp}` : "+"} XP
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-brand-sand/75">
          {compromised
            ? "Access control list flagged as MODIFIED. The mapping between XP and which missions you're shown can no longer be verified against a trusted source. Some agents are reporting missions above their clearance rendering anyway. This may or may not be intentional."
            : "Your clearance also controls which missions you're shown. The Challenges page groups everything into sections by clearance level — Unclassified challenges are visible to everyone, while Secret and Top Secret challenges only appear once your XP crosses into that tier. Leveling up doesn't just look good on your badge — it unlocks new missions."}
        </p>
      </Section>

      <Section id="challenge-types" title={compromised ? "EXPLOIT_CATALOG" : "Challenge Types"} icon="lock">
        <p className="mb-3 text-brand-sand/75">
          {compromised
            ? "Standard payloads follow the XP.EXE model described above — answer correctly, receive XP of disputed authenticity, move on. Two other payload types have been detected on this system:"
            : "Most challenges are the standard XP kind described above — answer correctly, earn XP, done. Some are a different kind entirely:"}
        </p>
        <ul className="space-y-2.5 text-brand-sand/75">
          <li className="flex gap-2.5">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
            <span>
              {compromised ? (
                <>
                  <strong className="text-brand-sand">Unindexed payloads</strong> (filed under a section labeled
                  &quot;Info&quot;, contents unverified) don&apos;t touch the XP ledger at all. A correct response
                  triggers an immediate, unsupervised content release directly to your screen — audio, image,
                  video, plaintext, or an outbound link of unconfirmed destination.
                </>
              ) : (
                <>
                  <strong className="text-brand-sand">Info challenges</strong> (shown in their own &quot;Info&quot;
                  section on the Challenges page) don&apos;t award XP at all. Instead, a correct answer
                  immediately unlocks bonus content right there on the page — that might be a short audio
                  clip, an image, a video, some extra text, or a link.
                </>
              )}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light-green" />
            <span>
              {compromised
                ? "No XP at risk means no lockout enforced. Retry attempts: unlimited, unlogged, unsupervised."
                : "Since there's no XP at stake, Info challenges allow unlimited attempts — a wrong guess just lets you try again, no penalty."}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="file" className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand/60" />
            <span>
              {compromised
                ? "Either payload type may render an attached image before you respond — inspect it at your own risk. Screenshot provenance not guaranteed."
                : "A challenge of either type might also show you an image as part of the question itself — for example, a phishing email screenshot to inspect before you answer."}
            </span>
          </li>
        </ul>
      </Section>

      <Section id="badges-flare" title={compromised ? "IDENTITY_SPOOFING" : "Badges & Flare"} icon="flame">
        <p className="mb-3 text-brand-sand/75">
          {compromised
            ? "Every account on this system has an identity file — a codename, an agent ID, a tier-colored render, and a fact of disputed accuracy, generated the moment access was first granted. Click any identity file on the Leaderboard to expand it full-size; a flip animation reveals a second, less-verified side."
            : "Every participant gets an agent badge — a codename, an agent ID, a tier-colored design, and a fun fact, generated the moment you show up. Click any badge on the Leaderboard to pull up a full-size spotlight view with a flip animation revealing the back."}
        </p>
        <p className="mb-3 text-brand-sand/75">
          {compromised ? (
            <>
              <strong className="text-brand-sand">Identity file modification: still self-service, apparently.</strong>{" "}
              Some payloads grant a cosmetic override on top of XP — a background render, a border pattern, an
              icon substitution, a ribbon string, or a name suffix. None of it applies automatically; it just
              becomes available on your own profile for you to apply yourself. Whether that's a feature or a
              vulnerability is unclear. Collect enough overrides and mix freely.
            </>
          ) : (
            <>
              <strong className="text-brand-sand">Flare customization is self-service.</strong> Some
              challenges reward a piece of badge flare on top of XP — a background effect, a border style, an
              icon, a ribbon phrase, or a name suffix. Completing one of those challenges doesn&apos;t apply
              the flare automatically; instead, it unlocks that option for you to choose from on your own
              profile. The more reward-bearing challenges you complete, the more customization options you
              have to pick from — mix and match whatever you&apos;ve earned.
            </>
          )}
        </p>
        <ul className="space-y-2.5 text-brand-sand/75">
          <li className="flex gap-2.5">
            <Icon name="crown" className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
            <span>
              {compromised
                ? "Check a payload's advertised rewards before attempting it — assuming the rewards section itself hasn't been tampered with."
                : "Check a challenge's Rewards section before you attempt it to see exactly what flare (if any) it offers."}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="file" className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand/60" />
            <span>
              {compromised
                ? "A custom image can still be uploaded to your identity file, cropping tool included. Source of the crop tool: unverified."
                : "You can also upload your own badge photo from your profile, with a built-in crop tool."}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light-green" />
            <span>
              {compromised
                ? "A handful of overrides — achievement chips, custom colors, a callout ribbon — are still being pushed directly by whoever currently controls the admin panel. That may still be Security. Keep watching your profile."
                : "A few special touches — achievement chips, custom colors, a callout ribbon — are still handed out directly by the Security team for standout participation. Keep an eye on your profile."}
            </span>
          </li>
        </ul>
      </Section>

      <Section id="chat-room" title={compromised ? "COMMS_LEAK" : "Chat Room"} icon="chat">
        <p className="mb-3 text-brand-sand/75">
          {compromised
            ? "An unsecured channel is still active on this system. Everything typed there is visible to everyone, and to whoever else may be listening. Treat it as compromised by default."
            : "There's a live channel for the whole event — trade banter, brag about your clearance, or call out whoever's still UNCLASSIFIED. Here's what it can do:"}
        </p>
        <ul className="space-y-2.5 text-brand-sand/75">
          <li className="flex gap-2.5">
            <Icon name="lightning" className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
            <span>
              {compromised ? (
                <>
                  <strong className="text-brand-sand">Tag another operative with @.</strong> A dropdown of every
                  known identity on the system appears as you type. Whoever you tag gets flagged next time
                  they check in — assuming the flag itself hasn't been intercepted first.
                </>
              ) : (
                <>
                  <strong className="text-brand-sand">@mention anyone.</strong> Type @ and pick a name from the
                  autocomplete dropdown — they&apos;ll see a red dot on Chat Room in the nav next time they check
                  in, and their name lights up in the message.
                </>
              )}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light-green" />
            <span>
              {compromised
                ? "Every identity file rendered in the channel matches its current tier color/icon, or whatever override it's carrying — hover one to pull up a condensed dossier (codename, tier, XP) without leaving the feed."
                : "Names and @mentions are colored/icon-tagged with that agent's clearance tier (or their own badge flare override, if they've customized one) — hover any name for a quick preview card (codename, tier, XP)"}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="trophy" className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
            <span>
              {compromised ? (
                <>
                  Typing{" "}
                  <code className="rounded bg-brand-sand/10 px-1.5 py-0.5 font-terminal text-xs">/flex</code>{" "}
                  auto-posts a formatted brag of your own tier/XP/codename. No idea who added that. Seems on-brand.
                </>
              ) : (
                <>
                  Typing{" "}
                  <code className="rounded bg-brand-sand/10 px-1.5 py-0.5 font-terminal text-xs">/flex</code>{" "}
                  and sending posts a formatted brag with your current tier, XP, and codename — built from your
                  own stats, no typing required.
                </>
              )}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="file" className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand/60" />
            <span>
              {compromised
                ? "A live roster of who's currently connected sits above the feed, alongside a flicker whenever someone's actively composing — neither can be spoofed from this end."
                : "An \"online now\" strip shows who's actively got the room open, and a small \"is typing...\" indicator appears while someone's composing a reply."}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="crown" className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
            <span>
              {compromised
                ? "An automated feed injects its own system-labeled transmissions into the channel — new exploits going live, and anyone whose clearance just escalated. Source: presumed still friendly."
                : "A system feed automatically announces new challenges going live and anyone who just leveled up their clearance — no need to check the Challenges page or Leaderboard to catch it."}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
            <span>
              {compromised
                ? "React to any transmission with a tap-to-toggle emoji — counts update live for everyone watching, whether or not that's a good idea."
                : "React to any message with a quick emoji — click to add, click again to remove, and everyone watching sees the count update live."}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="skull" className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            <span>
              {compromised
                ? "At least one identity in the channel is flagged ROGUE and cannot be traced back to Security. Its transmissions are visibly corrupted. Engage at your own risk."
                : "Keep an eye out for anyone flagged ROGUE — their messages stand out for a reason, and they don't exactly play by the rules."}
            </span>
          </li>
        </ul>
      </Section>

      <Section id="fair-play" title={compromised ? "ANTI-TAMPER.CFG" : "Fair Play"} icon="lock">
        <p className="text-brand-sand/75">
          {compromised
            ? "Integrity monitor offline. Sharing answers, submitting on behalf of another agent, and gaming the free-response queue are all technically still against policy — enforcement is, for the moment, best-effort."
            : "This is meant to be fun. Don't share answers, don't submit on behalf of someone else, and don't try to game the free-response reviews. The Security team reserves the right to adjust XP for shenanigans."}
        </p>
      </Section>
    </div>
  );
}
