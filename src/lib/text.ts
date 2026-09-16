// Auto-linkify plain http(s) URLs embedded in free-text admin content
// (challenge descriptions, unlock text) so an admin can just paste a link
// like "https://mywordle.strivemath.com/?id=..." into a textarea and have
// it render as a clickable link, rather than requiring markdown/HTML.

export interface TextSegment {
  type: "text" | "link";
  value: string;
}

const URL_RE = /https?:\/\/[^\s<>"')]+/g;

/** Splits `text` into plain-text and link segments around any http(s) URLs found. */
export function linkifySegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_RE)) {
    let url = match[0];
    const start = match.index ?? 0;
    // Trim trailing sentence punctuation that's almost certainly not part
    // of the URL itself (e.g. "...check it out: https://foo.com." ends
    // with a period that belongs to the sentence, not the link).
    let trailing = "";
    while (url.length > 0 && /[.,;:!?]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    if (start > lastIndex) segments.push({ type: "text", value: text.slice(lastIndex, start) });
    segments.push({ type: "link", value: url });
    if (trailing) segments.push({ type: "text", value: trailing });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", value: text.slice(lastIndex) });
  return segments;
}
