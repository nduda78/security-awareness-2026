// Deterministic per-employee flavor generation: codenames, agent IDs, fun
// facts, barcodes. All derived from the employee's lowercased email — the
// stable identity key — via the hash utilities in hash.ts. Codenames are
// guaranteed unique across the current participant set (see
// resolveUniqueCodenames below).

import { fnv1a, seededInt } from "./hash";

const ADJECTIVES = [
  "FIREWALLED",
  "SPOOFED",
  "ENCRYPTED",
  "PHISHY",
  "GHOST",
  "ROOTED",
  "PATCHED",
  "SANDBOXED",
  "AIRGAPPED",
  "QUARANTINED",
  "SHREDDED",
  "CLOAKED",
  "REDACTED",
  "HOTBOXED",
  "BUDDED",
  "TRIMMED",
  "CURED",
  "DANK",
  "STICKY",
  "TERPY",
  "HAZY",
  "FROSTED",
  "BAKED",
  "ROLLED",
  "TOASTED",
  "SEALED",
  "MASKED",
  "SHADOW",
  "COVERT",
  "SILENT",
];

const NOUNS = [
  "COOKIES",
  "PUNCH",
  "PROTOCOL",
  "KUSH",
  "PAYLOAD",
  "BACKDOOR",
  "FIREWALL",
  "GELATO",
  "DIESEL",
  "HAZE",
  "EXPLOIT",
  "MALWARE",
  "TROJAN",
  "CIPHER",
  "PACKET",
  "SIGNAL",
  "VAULT",
  "BUDTENDER",
  "STRAIN",
  "EDIBLE",
  "PRE-ROLL",
  "DAB",
  "SESH",
  "KEYLOGGER",
  "KEYCARD",
  "TOKEN",
  "PATCH",
  "SNIFFER",
  "PROXY",
  "PIPELINE",
];

export interface FlavorProfile {
  codename: string;
  agentId: string;
  funFact: string;
  barcode: string;
}

const FUN_FACT_TEMPLATES = [
  "Reports seeing phishing emails in their sleep now.",
  "Has never once clicked 'Reply All' by accident. Allegedly.",
  "Keeps a sticky note with their password on it. (This is a joke. Please don't.)",
  "Once mistook a security drill for an actual apocalypse.",
  "Changed their password to 'Password1!' and immediately regretted it.",
  "Reported a phishing email so fast the sender got suspicious.",
  "Believes the office plant is a corporate spy. Not wrong to be cautious.",
  "Has 47 browser tabs open, 12 of which are security training modules.",
  "Once high-fived IT Security in the elevator. Unprompted.",
  "Uses a password manager and isn't afraid to say so.",
  "Suspects the coffee machine has been compromised.",
  "Locks their screen even for a 10-second bathroom break. A true professional.",
  "Once diffused a phishing attempt with nothing but vibes and skepticism.",
  "Has a 'zero trust' policy that extends to the office vending machine.",
  "Refuses to plug in a mystery USB stick, no matter how good the donuts look.",
];

export function computeFlavorProfile(email: string): Omit<FlavorProfile, "codename"> {
  const key = email.trim().toLowerCase();
  const h = fnv1a(key);

  const agentNum = (h % 9000) + 1000; // 1000-9999
  const agentId = `AGT-${agentNum}`;

  const funFact = FUN_FACT_TEMPLATES[seededInt(key, FUN_FACT_TEMPLATES.length, "fact")];

  // Simple deterministic pseudo-barcode: a run of bar widths encoded as a
  // string of block characters, purely decorative.
  const barLen = 24;
  let barcode = "";
  for (let i = 0; i < barLen; i++) {
    const v = seededInt(key, 4, `bar-${i}`);
    barcode += ["▏", "▎", "▌", "▉"][v];
  }

  return { agentId, funFact, barcode };
}

function baseCodename(email: string, attempt: number): string {
  const key = email.trim().toLowerCase();
  const adj = ADJECTIVES[seededInt(key, ADJECTIVES.length, `adj-${attempt}`)];
  const noun = NOUNS[seededInt(key, NOUNS.length, `noun-${attempt}`)];
  return `${adj} ${noun}`;
}

/**
 * Given a list of employee emails (already in a STABLE order — e.g. sorted
 * by email — so results don't reshuffle just because someone's XP changed),
 * returns a Map<email, codename> guaranteed to have no duplicate codenames.
 *
 * Collision handling: process emails in the stable input order. The first
 * person to claim a given adjective+noun combo keeps it. Anyone who
 * collides deterministically retries the next attempt index for their own
 * email (still fully deterministic — same inputs always produce the same
 * output), up to the size of the full pool, and falls back to a numbered
 * suffix ("GHOST PROTOCOL 2") if the pool is ever exhausted.
 */
export function resolveUniqueCodenames(
  emailsInStableOrder: string[],
  overrides: Map<string, string>
): Map<string, string> {
  const result = new Map<string, string>();
  const taken = new Set<string>();

  // Overrides are exact custom text from admins — they claim their slot
  // first and are exempt from collision resolution (an admin explicitly
  // asked for this text).
  for (const email of emailsInStableOrder) {
    const override = overrides.get(email);
    if (override) {
      result.set(email, override);
      taken.add(override.toUpperCase());
    }
  }

  const maxAttempts = ADJECTIVES.length * NOUNS.length;

  for (const email of emailsInStableOrder) {
    if (result.has(email)) continue;

    let assigned: string | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = baseCodename(email, attempt);
      if (!taken.has(candidate.toUpperCase())) {
        assigned = candidate;
        break;
      }
    }

    if (!assigned) {
      // Pool fully exhausted (shouldn't happen at realistic headcounts) —
      // deterministic numbered fallback.
      const base = baseCodename(email, 0);
      let n = 2;
      let candidate = `${base} ${n}`;
      while (taken.has(candidate.toUpperCase())) {
        n++;
        candidate = `${base} ${n}`;
      }
      assigned = candidate;
    }

    result.set(email, assigned);
    taken.add(assigned.toUpperCase());
  }

  return result;
}
