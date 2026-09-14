import { cookies } from "next/headers";
import crypto from "crypto";

const AGENT_COOKIE = "agent_session";
const ADMIN_COOKIE = "admin_session";
const ROGUE_COOKIE = "rogue_unlocked";

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
  email: string;
  displayName: string;
}

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

export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  return unsign(raw) === "ok";
}

export function encodeAdminCookie(): string {
  return sign("ok");
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;

export async function isRogueUnlocked(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ROGUE_COOKIE)?.value;
  if (!raw) return false;
  return unsign(raw) === "ok";
}

export function encodeRogueCookie(): string {
  return sign("ok");
}

export const ROGUE_COOKIE_NAME = ROGUE_COOKIE;
