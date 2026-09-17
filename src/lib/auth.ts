// Name+PIN account auth. Mirrors the pattern used by the internal
// world-cup-pool VAPE app (bcryptjs-hashed PIN, no email/SSO), adapted to
// this app's existing identity key: full name instead of a chosen
// username, since nothing here needs a unique handle beyond the person's
// own name, and the app never used email for anything but identity.
import bcrypt from "bcryptjs";

/**
 * Turns a full name into the lowercase, hyphenated slug stored in
 * Employee.email (the app's stable identity key - see schema comment).
 * Deliberately simple: lowercase, strip anything that isn't a letter/digit,
 * collapse runs of separators into a single hyphen. Two different people
 * with the same name will collide here on purpose - callers are
 * responsible for detecting that collision and asking the second person to
 * disambiguate (see registerAction in actions/identify.ts).
 */
export function slugifyName(fullName: string): string {
  return fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PIN_RE = /^\d{4}$/;

export function isValidPin(pin: string): boolean {
  return PIN_RE.test(pin);
}

export function hashPin(pin: string): string {
  return bcrypt.hashSync(pin, 10);
}

export function verifyPin(pin: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(pin, hash);
  } catch {
    return false;
  }
}

// Same bcrypt hash/verify plumbing as the PIN (hashPin/verifyPin), just a
// looser length rule - the "vault" second-factor password (see the
// Employee.extraPasswordHash schema comment) is free-text, not 4 digits.
export function isValidVaultPassword(pw: string): boolean {
  return pw.trim().length >= 6 && pw.length <= 100;
}
