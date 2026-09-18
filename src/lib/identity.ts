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

// Short one-liners on purpose — these render on the badge itself (a fixed-
// size card), not in a scrollable panel, so anything long gets clipped.
// Kept well under ~50 characters so they reliably fit on one line.
const FUN_FACT_TEMPLATES = [
  "Never skips MFA, ever.",
  "Caught a phish before their coffee.",
  "Locks screen for a quick break.",
  "Guards passwords like a vault.",
  "Zero trust, even the snack drawer.",
  "Encrypts laptops, no exceptions.",
  "Rotates passwords like a menu.",
  "Shares neither logins nor bongs.",
  "Knows indica from incidents.",
  "Password manager, not a dealer.",
  "Suspects the vape cart got hacked.",
  "Praised IT for catching a phish.",
  "Diffused a phish with pure vibes.",
  "Suspects the CBD jar is a setup.",
  "API keys: secret like strains.",
  "Mistook a drill for a DEA raid.",
  "Locks devices like sealing a jar.",
  "Changed password after one scare.",
  "Never shares passwords or grinders.",
  "Scans every link, like a CoA test.",
  "Zero trust, full encryption.",
  "MFA beats any budtender's advice.",
  "Keeps devices locked like a vault.",
  "Spots a scam from a mile away.",
  "Spots phish faster than 4/20 lines.",
];

export function computeFlavorProfile(email: string): Omit<FlavorProfile, "codename" | "funFact"> {
  const key = email.trim().toLowerCase();
  const h = fnv1a(key);

  const agentNum = (h % 9000) + 1000; // 1000-9999
  const agentId = `AGT-${agentNum}`;

  // Simple deterministic pseudo-barcode: a run of bar widths encoded as a
  // string of block characters, purely decorative.
  const barLen = 24;
  let barcode = "";
  for (let i = 0; i < barLen; i++) {
    const v = seededInt(key, 4, `bar-${i}`);
    barcode += ["▏", "▎", "▌", "▉"][v];
  }

  return { agentId, barcode };
}

/**
 * Given a list of employee emails (already in a STABLE order — e.g. sorted
 * by email), returns a Map<email, funFact> guaranteed to have no duplicate
 * fun facts, using the same deterministic collision-resolution approach as
 * resolveUniqueCodenames: each email retries the pool with a different salt
 * on collision, and falls back to the first free slot if the whole pool of
 * candidates it tried is exhausted (only possible if headcount exceeds the
 * template pool size).
 */
export function resolveUniqueFunFacts(emailsInStableOrder: string[]): Map<string, string> {
  const result = new Map<string, string>();
  const takenIndexes = new Set<number>();

  for (const email of emailsInStableOrder) {
    const key = email.trim().toLowerCase();

    let assignedIndex: number | null = null;
    for (let attempt = 0; attempt < FUN_FACT_TEMPLATES.length; attempt++) {
      const idx = seededInt(key, FUN_FACT_TEMPLATES.length, `fact-${attempt}`);
      if (!takenIndexes.has(idx)) {
        assignedIndex = idx;
        break;
      }
    }

    if (assignedIndex === null) {
      // Pool fully exhausted for this key's attempts (more participants than
      // templates) — deterministic fallback to the first still-free slot.
      assignedIndex = FUN_FACT_TEMPLATES.findIndex((_, i) => !takenIndexes.has(i));
    }
    if (assignedIndex === -1 || assignedIndex === null) {
      // Truly out of unique facts (headcount > pool size) — reuse
      // deterministically rather than crash. Duplicates are then
      // unavoidable, but every earlier participant still got a unique one.
      assignedIndex = seededInt(key, FUN_FACT_TEMPLATES.length, "fact-fallback");
    }

    takenIndexes.add(assignedIndex);
    result.set(email, FUN_FACT_TEMPLATES[assignedIndex]);
  }

  return result;
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
