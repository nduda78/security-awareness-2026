// Outbound integration webhooks - lets an admin point a challenge (or the
// whole "someone leveled up" event) at an external listener like Tines and
// get a JSON POST with the relevant data, for whatever automation they
// want to build on top of it. Deliberately fire-and-forget from the
// caller's point of view: a slow or dead webhook endpoint must never make
// a real agent's submission fail or hang - errors are swallowed (and
// logged server-side) rather than thrown, and every call is bounded by a
// short timeout.

import type { TierDef } from "./tiers";
import { getClearanceWebhookConfig } from "./settings";

const WEBHOOK_TIMEOUT_MS = 5_000;

async function postWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    // Never let an admin's misconfigured/offline webhook break the real
    // feature (grading a submission, announcing a tier-up) that triggered
    // it - just log so it's visible in the proc's own logs.
    console.error(`[webhook] POST to ${url} failed:`, err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(timeout);
  }
}

/** Fired once, the first time an agent's submission for this challenge actually grades/reviews CORRECT. */
export async function fireChallengeCompletedWebhook(
  challenge: { slug: string; title: string; xpValue: number; rewardMode: string; webhookUrl: string | null },
  employee: { email: string; displayName: string },
  xpAwarded: number
): Promise<void> {
  const url = challenge.webhookUrl?.trim();
  if (!url) return;
  await postWebhook(url, {
    event: "challenge_completed",
    challenge: {
      slug: challenge.slug,
      title: challenge.title,
      xpValue: challenge.xpValue,
      rewardMode: challenge.rewardMode,
    },
    agent: {
      slug: employee.email,
      displayName: employee.displayName,
    },
    xpAwarded,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Fired once, the moment a challenge actually becomes available to
 * agents - immediately if it has no Opens At, or exactly when its
 * scheduled Opens At time arrives otherwise. Uses the same webhookUrl as
 * fireChallengeCompletedWebhook (one URL per challenge, two possible
 * events) and the same trigger moment as the Chat Room's "New challenge
 * dropped" announcement - see announceJustOpenedChallenges in
 * challengeDrops.ts, which is the only caller.
 */
export async function fireChallengePostedWebhook(challenge: {
  slug: string;
  title: string;
  xpValue: number;
  rewardMode: string;
  webhookUrl: string | null;
}): Promise<void> {
  const url = challenge.webhookUrl?.trim();
  if (!url) return;
  await postWebhook(url, {
    event: "challenge_posted",
    challenge: {
      slug: challenge.slug,
      title: challenge.title,
      xpValue: challenge.xpValue,
      rewardMode: challenge.rewardMode,
    },
    postedAt: new Date().toISOString(),
  });
}

/** Fired when an agent's XP-derived clearance tier increases, if the admin has enabled + configured the global clearance webhook. */
export async function fireClearanceUpgradedWebhook(
  employee: { email: string; displayName: string },
  previousTier: TierDef,
  newTier: TierDef,
  xp: number
): Promise<void> {
  const config = await getClearanceWebhookConfig();
  if (!config.enabled || !config.url) return;
  await postWebhook(config.url, {
    event: "clearance_upgraded",
    agent: {
      slug: employee.email,
      displayName: employee.displayName,
    },
    previousTier: { key: previousTier.key, label: previousTier.label },
    newTier: { key: newTier.key, label: newTier.label },
    xp,
    occurredAt: new Date().toISOString(),
  });
}
