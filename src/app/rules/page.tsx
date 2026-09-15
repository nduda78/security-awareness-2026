import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TIERS } from "@/lib/tiers";
import type { IconKey } from "@/lib/flare";

function Section({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: IconKey;
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

const TOC: { id: string; label: string }[] = [
  { id: "xp", label: "How XP Works" },
  { id: "clearance", label: "Clearance Tiers" },
  { id: "challenge-types", label: "Challenge Types" },
  { id: "badges-flare", label: "Badges & Flare" },
  { id: "fair-play", label: "Fair Play" },
];

export default function RulesPage() {
  const visibleTiers = [...TIERS].filter((t) => t.key !== "ROGUE").sort((a, b) => a.minXp - b.minXp);

  return (
    <div className="fade-in-up max-w-3xl space-y-6">
      <div className="mb-4">
        <div className="section-eyebrow mb-2">Briefing Document</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Rules &amp; <span className="gradient-text">How It Works</span>
        </h1>
        <p className="mt-3 text-brand-sand/70">
          All October, the Security team will drop new challenges — phishing quizzes, briefings, trivia,
          and more. Complete a challenge to earn XP. Earn enough XP and your security clearance advances.
          Higher clearance means bragging rights, a fancier badge, access to more challenges, and (maybe)
          some real prizes.
        </p>
      </div>

      <nav aria-label="Table of contents" className="glass-panel rounded-2xl p-5">
        <div className="mb-3 font-terminal text-xs uppercase tracking-widest text-brand-cyan">Contents</div>
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
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="xp" title="How XP Works" icon="shield">
        <ul className="space-y-2.5 text-brand-sand/75">
          {[
            "Each XP challenge has its own XP value based on difficulty.",
            "Submit your answer through the challenge's in-app form.",
            "Correct answers award XP automatically and instantly update your profile and the Leaderboard.",
            "Some challenges are graded automatically; free-response ones are reviewed by the Security team before XP is awarded.",
          ].map((line, i) => (
            <li key={i} className="flex gap-2.5">
              <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light-green" />
              <span>{line}</span>
            </li>
          ))}
          <li className="flex gap-2.5">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
            <span>
              <strong className="text-brand-sand">Each XP challenge can only be completed once per person.</strong>{" "}
              Submitting a challenge you already completed won&apos;t earn extra XP, and you won&apos;t get a
              right/wrong reveal immediately — just a confirmation that your answer was received.
            </span>
          </li>
        </ul>
      </Section>

      <Section id="clearance" title="Clearance Tiers" icon="crown">
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
          Your clearance also controls which missions you&apos;re shown. The Challenges page groups
          everything into sections by clearance level — Unclassified challenges are visible to everyone,
          while Secret and Top Secret challenges only appear once your XP crosses into that tier. Leveling
          up doesn&apos;t just look good on your badge — it unlocks new missions.
        </p>
      </Section>

      <Section id="challenge-types" title="Challenge Types" icon="lock">
        <p className="mb-3 text-brand-sand/75">
          Most challenges are the standard <strong className="text-brand-sand">XP</strong> kind described
          above — answer correctly, earn XP, done. Some are a different kind entirely:
        </p>
        <ul className="space-y-2.5 text-brand-sand/75">
          <li className="flex gap-2.5">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
            <span>
              <strong className="text-brand-sand">Info challenges</strong> (shown in their own &quot;Info&quot;
              section on the Challenges page) don&apos;t award XP at all. Instead, a correct answer
              immediately unlocks bonus content right there on the page — that might be a short audio
              clip, an image, a video, some extra text, or a link.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light-green" />
            <span>
              Since there&apos;s no XP at stake, Info challenges allow unlimited attempts — a wrong guess
              just lets you try again, no penalty.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="file" className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand/60" />
            <span>
              A challenge of either type might also show you an image as part of the question itself —
              for example, a phishing email screenshot to inspect before you answer.
            </span>
          </li>
        </ul>
      </Section>

      <Section id="badges-flare" title="Badges & Flare" icon="flame">
        <p className="mb-3 text-brand-sand/75">
          Every participant gets an agent badge — a codename, an agent ID, a tier-colored design, and a
          fun fact, generated the moment you show up. Click any badge on the Leaderboard to pull up a
          full-size spotlight view with a flip animation revealing the back.
        </p>
        <p className="mb-3 text-brand-sand/75">
          <strong className="text-brand-sand">Flare customization is self-service.</strong> Some
          challenges reward a piece of badge flare on top of XP — a background effect, a border style, an
          icon, a ribbon phrase, or a name suffix. Completing one of those challenges doesn&apos;t apply
          the flare automatically; instead, it unlocks that option for you to choose from on your own
          profile. The more reward-bearing challenges you complete, the more customization options you
          have to pick from — mix and match whatever you&apos;ve earned.
        </p>
        <ul className="space-y-2.5 text-brand-sand/75">
          <li className="flex gap-2.5">
            <Icon name="crown" className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
            <span>
              Check a challenge&apos;s Rewards section before you attempt it to see exactly what flare (if
              any) it offers.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="file" className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand/60" />
            <span>
              You can also upload your own badge photo from your profile, with a built-in crop tool.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light-green" />
            <span>
              A few special touches — achievement chips, custom colors, a callout ribbon — are still
              handed out directly by the Security team for standout participation. Keep an eye on your
              profile.
            </span>
          </li>
        </ul>
      </Section>

      <Section id="fair-play" title="Fair Play" icon="lock">
        <p className="text-brand-sand/75">
          This is meant to be fun. Don&apos;t share answers, don&apos;t submit on behalf of someone else,
          and don&apos;t try to game the free-response reviews. The Security team reserves the right to
          adjust XP for shenanigans.
        </p>
      </Section>
    </div>
  );
}
