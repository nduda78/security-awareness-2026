// Deterministic string hashing utilities. Same input (an employee's
// lowercased email) always produces the same output, across rebuilds/
// restarts — this is what makes codenames, agent IDs, fun facts, and
// barcodes stable rather than randomly reshuffling every page load.

/** FNV-1a 32-bit hash. Fast, deterministic, good-enough distribution for flavor text. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic 0..1 float derived from a string + optional salt. */
export function seededFloat(input: string, salt = ""): number {
  return fnv1a(`${input}::${salt}`) / 0xffffffff;
}

/** Deterministic integer in [0, max) derived from a string + optional salt. */
export function seededInt(input: string, max: number, salt = ""): number {
  if (max <= 0) return 0;
  return fnv1a(`${input}::${salt}`) % max;
}
