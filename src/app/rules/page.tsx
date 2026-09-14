import { Icon } from "@/components/Icon";
import { TIERS } from "@/lib/tiers";

export default function RulesPage() {
  const visibleTiers = [...TIERS].filter((t) => t.key !== "ROGUE").sort((a, b) => a.minXp - b.minXp);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <div className="font-terminal text-xs uppercase tracking-widest text-brand-light-green">
          Briefing Document
        </div>
        <h2 className="mb-4 text-2xl font-bold">Rules &amp; How It Works</h2>
        <p className="text-brand-sand/80">
          All October, the Security team will drop new challenges — phishing quizzes, briefings, trivia,
          and more. Complete a challenge to earn XP. Earn enough XP and your security clearance advances.
          Higher clearance means bragging rights, a fancier badge, and (maybe) some real prizes.
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">How XP works</h3>
        <ul className="list-disc space-y-2 pl-5 text-brand-sand/80">
          <li>Each challenge has its own XP value based on difficulty.</li>
          <li>Submit your answer through the challenge&apos;s in-app form.</li>
          <li>Correct answers award XP automatically and instantly update your profile.</li>
          <li>
            Some challenges are graded automatically; free-response ones are reviewed by the Security
            team before XP is awarded.
          </li>
          <li>
            <strong>Each challenge can only be completed once per person.</strong> Resubmitting a
            challenge you already completed won&apos;t earn extra XP.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Clearance tiers</h3>
        <div className="space-y-3">
          {visibleTiers.map((t) => (
            <div
              key={t.key}
              className="flex items-center gap-4 rounded-md border border-brand-sand/10 bg-black/20 p-3"
            >
              <Icon name={t.icon} className="h-8 w-8 shrink-0" style={{ color: t.color } as React.CSSProperties} />
              <div>
                <div className="font-terminal text-sm uppercase" style={{ color: t.color }}>
                  {t.label}
                </div>
                <div className="text-sm text-brand-sand/60">
                  {t.minXp}
                  {t.maxXp !== null ? `–${t.maxXp}` : "+"} XP
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-brand-sand/50">
          There may or may not be a fourth, unlisted tier. If you know, you know.
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Badges &amp; flare</h3>
        <p className="text-brand-sand/80">
          Beyond your tier, the Security team can hand out special flare for standout participation:
          achievement chips, custom badge colors and effects, prestige ribbons, and more. Keep an eye on
          your profile — you never know what might show up.
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Fair play</h3>
        <p className="text-brand-sand/80">
          This is meant to be fun. Don&apos;t share answers, don&apos;t submit on behalf of someone else,
          and don&apos;t try to game the free-response reviews. The Security team reserves the right to
          adjust XP for shenanigans.
        </p>
      </div>
    </div>
  );
}
