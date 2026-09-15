import { Icon } from "@/components/Icon";
import { TIERS } from "@/lib/tiers";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6">
      <h3 className="mb-3 font-display text-lg font-semibold text-brand-sand">{title}</h3>
      {children}
    </div>
  );
}

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
          Higher clearance means bragging rights, a fancier badge, and (maybe) some real prizes.
        </p>
      </div>

      <Section title="How XP works">
        <ul className="space-y-2.5 text-brand-sand/75">
          {[
            "Each challenge has its own XP value based on difficulty.",
            "Submit your answer through the challenge's in-app form.",
            "Correct answers award XP automatically and instantly update your profile.",
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
              <strong className="text-brand-sand">Each challenge can only be completed once per person.</strong>{" "}
              Resubmitting a challenge you already completed won&apos;t earn extra XP.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Clearance tiers">
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
        <p className="mt-4 text-sm text-brand-sand/40">
          There may or may not be a fourth, unlisted tier. If you know, you know.
        </p>
      </Section>

      <Section title="Badges & flare">
        <p className="text-brand-sand/75">
          Beyond your tier, the Security team can hand out special flare for standout participation:
          achievement chips, custom badge colors and effects, prestige ribbons, and more. Keep an eye on
          your profile — you never know what might show up.
        </p>
      </Section>

      <Section title="Fair play">
        <p className="text-brand-sand/75">
          This is meant to be fun. Don&apos;t share answers, don&apos;t submit on behalf of someone else,
          and don&apos;t try to game the free-response reviews. The Security team reserves the right to
          adjust XP for shenanigans.
        </p>
      </Section>
    </div>
  );
}
