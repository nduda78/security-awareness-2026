import { cookies } from "next/headers";
import crypto from "crypto";

const AGENT_COOKIE = "agent_session";
const ADMIN_COOKIE = "admin_session";

function secret() {
  return process.env.AGENT_SESSION_SECRET || "dev-secret";
}

function sign(value: string): string {
  const h = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${h}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? value : null;
}

export interface AgentIdentity {
  /// The stable identity slug (see schema comment on Employee.email - no
  /// longer a real email address as of the name+PIN auth migration).
  email: string;
  displayName: string;
}

// "Remain signed in until sign out" - a real password-gated account isn't
// meaningfully safer with a short expiry, so this is long enough to never
// practically expire on its own (~10 years) rather than silently bouncing
// someone back to /identify after some arbitrary number of months.
export const AGENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

/** Reads + verifies the employee identity cookie. Returns null if absent/invalid. */
export async function getAgentIdentity(): Promise<AgentIdentity | null> {
  const store = await cookies();
  const raw = store.get(AGENT_COOKIE)?.value;
  if (!raw) return null;
  const unsigned = unsign(raw);
  if (!unsigned) return null;
  try {
    const parsed = JSON.parse(Buffer.from(unsigned, "base64url").toString("utf8"));
    if (typeof parsed.email === "string" && typeof parsed.displayName === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeAgentCookie(identity: AgentIdentity): string {
  const payload = Buffer.from(JSON.stringify(identity), "utf8").toString("base64url");
  return sign(payload);
}

export const AGENT_COOKIE_NAME = AGENT_COOKIE;

/**
 * True if either the legacy passphrase-gated admin_session cookie is
 * valid, OR the currently signed-in employee (agent_session) has been
 * flagged isAdmin=true - flagged admins skip the passphrase entirely.
 */
export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (raw && unsign(raw) === "ok") return true;

  const identity = await getAgentIdentity();
  if (!identity) return false;

  const { prisma } = await import("./prisma");
  const employee = await prisma.employee.findUnique({
    where: { email: identity.email },
    select: { isAdmin: true },
  });
  return !!employee?.isAdmin;
}

export function encodeAdminCookie(): string {
  return sign("ok");
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
