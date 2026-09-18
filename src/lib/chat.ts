// Chat Room mention handling. Mentions are stored in the raw message body
// as "@<employee-slug>" (e.g. "@nick-duda") rather than display names -
// slugs are unique and hyphen-safe, so there's no ambiguity from spaces in
// real names the way "@Nick Duda" would have. The composer only ever
// *inserts* a mention via the autocomplete dropdown (see
// ChatRoomClient.tsx), so a well-formed slug always exists in practice,
// but everything here still degrades gracefully (renders as plain text)
// if a stray "@word" doesn't match a real slug.

const MENTION_RE = /@([a-z0-9-]+)/gi;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface MentionSegment {
  type: "text" | "mention";
  value: string;
  /** Only present for type "mention" - the display name to render. */
  displayName?: string;
  /** Only present for type "mention" - the slug, for linking to their profile. */
  slug?: string;
}

/**
 * Splits a raw message body into plain-text and mention segments, ready
 * to render. Only "@slug" tokens that match a real entry in `slugToName`
 * become mention chips - everything else (including a literal "@" that
 * isn't a real slug) stays as plain text.
 */
export function parseMentionSegments(body: string, slugToName: Map<string, string>): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  for (const match of body.matchAll(MENTION_RE)) {
    const slug = match[1].toLowerCase();
    const displayName = slugToName.get(slug);
    if (!displayName) continue; // not a real agent - leave as plain text
    const start = match.index ?? 0;
    if (start > lastIndex) segments.push({ type: "text", value: body.slice(lastIndex, start) });
    segments.push({ type: "mention", value: match[0], displayName, slug });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < body.length) segments.push({ type: "text", value: body.slice(lastIndex) });
  return segments;
}

/** All slugs mentioned in a body that match a real known slug (deduped). */
export function extractMentionedSlugs(body: string, knownSlugs: Set<string>): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(MENTION_RE)) {
    const slug = match[1].toLowerCase();
    if (knownSlugs.has(slug)) found.add(slug);
  }
  return [...found];
}

/** True if `body` mentions `slug` specifically, with a real word boundary (not just a substring of a longer slug). */
export function mentionsSlug(body: string, slug: string): boolean {
  const re = new RegExp(`@${escapeRegExp(slug)}(?![a-z0-9-])`, "i");
  return re.test(body);
}

/// System-message-only link marker: "[[label]](challenges/slug)", used so
/// e.g. the "New challenge dropped" announcement (see postSystemMessage in
/// actions/chat.ts) can hyperlink straight to the challenge without a full
/// markdown parser - just one narrow, deliberately simple pattern.
const SYSTEM_LINK_RE = /\[\[(.+?)\]\]\((.+?)\)/;

export interface SystemLinkParts {
  before: string;
  label: string;
  href: string;
  after: string;
}

/** Splits a system-message body around one embedded [[label]](href) marker, if present. */
export function parseSystemLink(body: string): SystemLinkParts | null {
  const match = body.match(SYSTEM_LINK_RE);
  if (!match) return null;
  const start = match.index ?? 0;
  return {
    before: body.slice(0, start),
    label: match[1],
    href: match[2],
    after: body.slice(start + match[0].length),
  };
}

export const CHAT_MAX_LENGTH = 2000;

/** Fixed quick-react palette - kept small and on-theme rather than a full emoji picker. */
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👀", "💯", "😮"];
