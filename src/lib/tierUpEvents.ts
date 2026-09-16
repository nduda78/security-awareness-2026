// Shared "did this agent's clearance tier just go up" check - used from
// both the normal auto-graded submission path (submit.ts) and the
// FREE_TEXT_REVIEW admin-approval path (admin.ts's reviewSubmissionAction),
// so a tier-up triggers the exact same Chat Room announcement and outbound
// webhook regardless of which path awarded the XP that caused it.
import { prisma } from "./prisma";
import { tierForXp } from "./tiers";
import { postSystemMessage } from "./actions/chat";
import { fireClearanceUpgradedWebhook } from "./webhooks";

/**
 * `xpBefore` is this employee's XP total from every OTHER already-CORRECT
 * submission (i.e. not counting whatever just earned `xpAwarded`) - the
 * caller computes it before writing the new submission row, since the
 * live XP total elsewhere in the app is always just a fresh sum over
 * CORRECT submissions (see buildAgentRoster), not a stored counter.
 *
 * ROGUE-override agents are skipped entirely - their tier isn't XP-driven
 * (effectiveTier always returns ROGUE for them), so there's no real
 * "tier up" moment to announce.
 */
export async function handlePossibleTierUp(
  employee: { id: string; email: string; displayName: string; rogueOverride: boolean },
  xpBefore: number,
  xpAwarded: number
): Promise<void> {
  if (xpAwarded <= 0 || employee.rogueOverride) return;
  const xpAfter = xpBefore + xpAwarded;
  const tierBefore = tierForXp(xpBefore);
  const tierAfter = tierForXp(xpAfter);
  if (tierAfter.key === tierBefore.key) return;

  await postSystemMessage(`🎉 ${employee.displayName} just reached ${tierAfter.label} clearance!`);
  await fireClearanceUpgradedWebhook(employee, tierBefore, tierAfter, xpAfter);
}

/** Sum of this employee's XP from every already-CORRECT submission (their live XP total, as computed everywhere else in the app). */
export async function getCurrentXp(employeeId: string): Promise<number> {
  const rows = await prisma.submission.findMany({
    where: { employeeId, status: "CORRECT" },
    select: { xpAwarded: true },
  });
  return rows.reduce((sum, s) => sum + s.xpAwarded, 0);
}
