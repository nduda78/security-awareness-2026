// Thin wrapper around the AppSetting singleton table. Currently just one
// toggle (the site-wide "compromised" cosmetic theme), read fresh on every
// request from the root layout - no caching, since an admin flipping this
// should take effect immediately for everyone, not after a stale-cache
// window.
import { prisma } from "./prisma";

const COMPROMISED_MODE_KEY = "compromisedMode";

export async function isCompromisedModeEnabled(): Promise<boolean> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: COMPROMISED_MODE_KEY } });
    return row?.value === "true";
  } catch {
    // Never let a settings read break every page on the site - default to
    // the normal theme if anything goes wrong.
    return false;
  }
}

export async function setCompromisedMode(enabled: boolean): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: COMPROMISED_MODE_KEY },
    update: { value: String(enabled) },
    create: { key: COMPROMISED_MODE_KEY, value: String(enabled) },
  });
}

const CLEARANCE_WEBHOOK_URL_KEY = "clearanceWebhookUrl";
const CLEARANCE_WEBHOOK_ENABLED_KEY = "clearanceWebhookEnabled";

export interface ClearanceWebhookConfig {
  enabled: boolean;
  url: string | null;
}

/** The global "someone leveled up" webhook - separate enabled flag from the URL itself, so an admin can temporarily pause it without losing the configured endpoint. */
export async function getClearanceWebhookConfig(): Promise<ClearanceWebhookConfig> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: [CLEARANCE_WEBHOOK_URL_KEY, CLEARANCE_WEBHOOK_ENABLED_KEY] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      enabled: map.get(CLEARANCE_WEBHOOK_ENABLED_KEY) === "true",
      url: map.get(CLEARANCE_WEBHOOK_URL_KEY) || null,
    };
  } catch {
    return { enabled: false, url: null };
  }
}

export async function setClearanceWebhookConfig(enabled: boolean, url: string | null): Promise<void> {
  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: CLEARANCE_WEBHOOK_ENABLED_KEY },
      update: { value: String(enabled) },
      create: { key: CLEARANCE_WEBHOOK_ENABLED_KEY, value: String(enabled) },
    }),
    prisma.appSetting.upsert({
      where: { key: CLEARANCE_WEBHOOK_URL_KEY },
      update: { value: url ?? "" },
      create: { key: CLEARANCE_WEBHOOK_URL_KEY, value: url ?? "" },
    }),
  ]);
}

const REVIEW_WEBHOOK_URL_KEY = "reviewWebhookUrl";
const REVIEW_WEBHOOK_ENABLED_KEY = "reviewWebhookEnabled";

export interface ReviewWebhookConfig {
  enabled: boolean;
  url: string | null;
}

/**
 * Global "a Free Text (manual review) answer is waiting on a human"
 * webhook - same enabled/url split as the clearance webhook above, so an
 * admin can pause it without losing the configured endpoint. Fires once
 * per submission the moment it lands in PENDING_REVIEW (see
 * fireReviewNeededWebhook in webhooks.ts) - separate from the per-
 * challenge webhookUrl and the clearance-upgrade webhook, since this one
 * exists purely so admins actually notice a review is waiting instead of
 * only finding out by checking the Audit Log / Answers page by hand.
 */
export async function getReviewWebhookConfig(): Promise<ReviewWebhookConfig> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: [REVIEW_WEBHOOK_URL_KEY, REVIEW_WEBHOOK_ENABLED_KEY] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      enabled: map.get(REVIEW_WEBHOOK_ENABLED_KEY) === "true",
      url: map.get(REVIEW_WEBHOOK_URL_KEY) || null,
    };
  } catch {
    return { enabled: false, url: null };
  }
}

export async function setReviewWebhookConfig(enabled: boolean, url: string | null): Promise<void> {
  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: REVIEW_WEBHOOK_ENABLED_KEY },
      update: { value: String(enabled) },
      create: { key: REVIEW_WEBHOOK_ENABLED_KEY, value: String(enabled) },
    }),
    prisma.appSetting.upsert({
      where: { key: REVIEW_WEBHOOK_URL_KEY },
      update: { value: url ?? "" },
      create: { key: REVIEW_WEBHOOK_URL_KEY, value: url ?? "" },
    }),
  ]);
}
