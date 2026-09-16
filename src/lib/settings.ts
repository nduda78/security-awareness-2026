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
