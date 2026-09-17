"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  encodeAgentCookie,
  AGENT_COOKIE_NAME,
  AGENT_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  encodePendingVaultCookie,
  getPendingVaultEmail,
  PENDING_VAULT_COOKIE_NAME,
  PENDING_VAULT_MAX_AGE,
} from "@/lib/session";
import { slugifyName, isValidPin, hashPin, verifyPin } from "@/lib/auth";

function fail(mode: "register" | "login", next: string, message: string): never {
  redirect(`/identify?mode=${mode}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);
}

function fullName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

async function setSessionAndRedirect(email: string, displayName: string, next: string) {
  const store = await cookies();
  store.set(AGENT_COOKIE_NAME, encodeAgentCookie({ email, displayName }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: AGENT_COOKIE_MAX_AGE,
  });
  // The legacy passphrase-unlock cookie is a separate, identity-independent
  // grant - left alone, it would silently carry admin access over to
  // whoever signs into this browser next, regardless of their own isAdmin
  // flag (this is exactly the bug where a brand-new, non-admin-flagged
  // agent inherited admin access from a PREVIOUS person's passphrase
  // unlock in the same browser). Clearing it on every sign-in forces admin
  // access to be re-derived fresh for whoever is actually signed in now:
  // either their own isAdmin flag, or the passphrase again.
  store.delete(ADMIN_COOKIE_NAME);
  redirect(next.startsWith("/") ? next : "/leaderboard");
}

/**
 * "New agent" tab. Two cases:
 *  - Nobody has this name yet -> create a fresh Employee, PIN required.
 *  - Someone already registered this exact name -> reject and point them
 *    at the login tab, UNLESS that row is a legacy account migrated from
 *    the old email-cookie identity model (pinHash still null) - in that
 *    case this is treated as "claiming" the pre-existing profile (and its
 *    XP/badge history) by setting its PIN for the first time.
 */
export async function registerAction(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();
  const next = String(formData.get("next") ?? "/leaderboard");

  const name = fullName(firstName, lastName);
  const errors: string[] = [];
  if (!firstName || !lastName) errors.push("First and last name are required.");
  if (!isValidPin(pin)) errors.push("PIN must be exactly 4 digits.");
  if (pin !== confirmPin) errors.push("PINs don't match.");
  if (errors.length > 0) fail("register", next, errors.join(" "));

  const slug = slugifyName(name);
  if (!slug) fail("register", next, "Enter a valid name.");

  const existing = await prisma.employee.findUnique({ where: { email: slug } });

  if (existing && existing.pinHash) {
    fail(
      "register",
      next,
      `An agent named "${name}" already has an account. If that's you, use the Returning Agent tab instead.`
    );
  }

  const pinHash = hashPin(pin);

  if (existing) {
    // Legacy row from before PINs existed - claim it, keep its history.
    await prisma.employee.update({
      where: { email: slug },
      data: { pinHash, displayName: name },
    });
  } else {
    await prisma.employee.create({
      data: { email: slug, displayName: name, pinHash },
    });
  }

  await setSessionAndRedirect(slug, name, next);
}

/** "Returning agent" tab. */
export async function loginAction(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const next = String(formData.get("next") ?? "/leaderboard");

  const name = fullName(firstName, lastName);
  if (!firstName || !lastName || !pin) {
    fail("login", next, "Name and PIN are required.");
  }

  const slug = slugifyName(name);
  const existing = await prisma.employee.findUnique({ where: { email: slug } });

  if (!existing) {
    fail("login", next, `No agent named "${name}" was found. New here? Use the New Agent tab.`);
  }
  if (!existing.pinHash) {
    fail(
      "login",
      next,
      `"${name}" hasn't set a PIN yet. Use the New Agent tab once to claim this profile with a PIN.`
    );
  }
  if (!verifyPin(pin, existing.pinHash)) {
    fail("login", next, "Incorrect PIN.");
  }

  // Some identities need one more thing beyond the PIN - see the schema
  // comment on Employee.extraPasswordHash. The PIN was genuinely correct
  // (that's real progress, hence the taunt on the next screen instead of
  // a generic "incorrect" error), but the session isn't established yet.
  if (existing.extraPasswordHash) {
    const store = await cookies();
    store.set(PENDING_VAULT_COOKIE_NAME, encodePendingVaultCookie(existing.email), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: PENDING_VAULT_MAX_AGE,
    });
    redirect(`/identify?step=vault&next=${encodeURIComponent(next)}`);
  }

  await setSessionAndRedirect(existing.email, existing.displayName, next);
}

/**
 * Second step for an identity with an extraPasswordHash set (see
 * loginAction above) - reads WHO from the signed pending-vault cookie
 * (never a client-suppliable field, so this can't be reached without
 * already having passed the real PIN check), verifies the extra
 * password, and only then actually establishes the session.
 */
export async function verifyVaultPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/leaderboard");

  const email = await getPendingVaultEmail();
  if (!email) {
    fail("login", next, "That took too long - sign in again.");
  }

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee || !employee.extraPasswordHash || !verifyPin(password, employee.extraPasswordHash)) {
    redirect(
      `/identify?step=vault&next=${encodeURIComponent(next)}&error=${encodeURIComponent("Thought you were clever, huh?")}`
    );
  }

  const store = await cookies();
  store.delete(PENDING_VAULT_COOKIE_NAME);
  await setSessionAndRedirect(employee.email, employee.displayName, next);
}

export async function signOutAction() {
  const store = await cookies();
  store.delete(AGENT_COOKIE_NAME);
  // Same reasoning as setSessionAndRedirect above - signing out shouldn't
  // leave a live admin unlock sitting around for the next person to pick
  // up on this browser.
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/leaderboard");
}
