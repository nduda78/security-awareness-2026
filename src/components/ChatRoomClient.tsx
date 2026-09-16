"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import {
  postChatMessageAction,
  deleteChatMessageAction,
  markChatReadAction,
  toggleReactionAction,
  setTypingAction,
  type PostedMessage,
  type ReactionSummary,
  type Presence,
} from "@/lib/actions/chat";
import { parseMentionSegments, mentionsSlug, CHAT_MAX_LENGTH, REACTION_EMOJIS } from "@/lib/chat";

export interface RosterEntry {
  slug: string;
  displayName: string;
  tierColor: string;
  tierIcon: string;
  tierLabel: string;
  outlineColor: string | null;
  iconOverride: string | null;
  xp: number;
  codename: string;
  photoUrl: string | null;
}

function Reactions({
  messageId,
  reactions,
  onToggle,
}: {
  messageId: string;
  reactions: ReactionSummary[];
  onToggle: (messageId: string, emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="relative mt-1.5 flex flex-wrap items-center gap-1.5">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(messageId, r.emoji)}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
            r.mine
              ? "border-brand-cyan/50 bg-brand-cyan/15 text-brand-sand"
              : "border-brand-sand/15 bg-brand-sand/5 text-brand-sand/60 hover:border-brand-sand/30"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-terminal text-[10px]">{r.count}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className="rounded-full border border-brand-sand/10 px-1.5 py-0.5 text-xs text-brand-sand/0 opacity-0 transition group-hover:text-brand-sand/50 group-hover:opacity-100 hover:!border-brand-sand/30 hover:!text-brand-sand"
      >
        +😊
      </button>
      {pickerOpen && (
        <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-xl border border-brand-sand/15 bg-brand-dark-green p-1.5 shadow-xl">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onToggle(messageId, emoji);
                setPickerOpen(false);
              }}
              className="rounded-lg px-1.5 py-1 text-base transition hover:bg-brand-sand/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const POLL_INTERVAL_MS = 4000;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Avatar({ slug, name, isRogue }: { slug: string; name: string; isRogue?: boolean }) {
  const [errored, setErrored] = useState(false);
  const ring = isRogue ? "ring-2 ring-brand-red rogue-flicker" : "";
  if (errored) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-sand/10 font-terminal text-xs text-brand-sand/50 ${ring}`}
      >
        {initials(name)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
    <img
      src={`/api/photo/${encodeURIComponent(slug)}`}
      alt=""
      onError={() => setErrored(true)}
      className={`h-9 w-9 shrink-0 rounded-full bg-brand-sand/10 object-cover ${ring}`}
    />
  );
}

/** Hover-preview popover shared by message-author names and @mention chips - reads straight off the roster already loaded client-side, no network round trip. */
function AgentLink({
  slug,
  rosterBySlug,
  className,
  children,
}: {
  slug: string;
  rosterBySlug: Map<string, RosterEntry>;
  className?: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const entry = rosterBySlug.get(slug);
  return (
    <span className="relative inline-block" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Link href={`/profile/${encodeURIComponent(slug)}`} className={className}>
        {children}
      </Link>
      {hover && entry && (
        <div className="absolute bottom-full left-0 z-30 mb-1.5 w-56 rounded-xl border border-brand-sand/15 bg-brand-dark-green p-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Avatar slug={entry.slug} name={entry.displayName} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-brand-sand">{entry.displayName}</div>
              <div className="truncate font-terminal text-[10px] text-brand-sand/40">"{entry.codename}"</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between font-terminal text-[10px]">
            <span className="uppercase tracking-wide" style={{ color: entry.outlineColor ?? entry.tierColor }}>
              {entry.tierLabel}
            </span>
            <span className="text-brand-yellow">{entry.xp} XP</span>
          </div>
        </div>
      )}
    </span>
  );
}

function MessageBody({
  body,
  slugToName,
  rosterBySlug,
}: {
  body: string;
  slugToName: Map<string, string>;
  rosterBySlug: Map<string, RosterEntry>;
}) {
  const segments = useMemo(() => parseMentionSegments(body, slugToName), [body, slugToName]);
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-brand-sand/90">
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <AgentLink
            key={i}
            slug={seg.slug!}
            rosterBySlug={rosterBySlug}
            className="rounded bg-brand-cyan/15 px-1 py-0.5 font-medium text-brand-cyan hover:bg-brand-cyan/25"
          >
            @{seg.displayName}
          </AgentLink>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </p>
  );
}

export function ChatRoomClient({
  initialMessages,
  roster,
  currentSlug,
  isAdmin,
  initialPresence,
}: {
  initialMessages: PostedMessage[];
  roster: RosterEntry[];
  currentSlug: string;
  isAdmin: boolean;
  initialPresence: Presence;
}) {
  const [messages, setMessages] = useState<PostedMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [presence, setPresence] = useState<Presence>(initialPresence);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const latestCreatedAtRef = useRef<string | null>(initialMessages.at(-1)?.createdAt ?? null);
  const lastTypingPingRef = useRef(0);
  const isTypingRef = useRef(false);

  const slugToName = useMemo(() => new Map(roster.map((r) => [r.slug, r.displayName])), [roster]);
  const rosterBySlug = useMemo(() => new Map(roster.map((r) => [r.slug, r])), [roster]);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return roster
      .filter((r) => r.slug !== currentSlug)
      .filter((r) => r.displayName.toLowerCase().includes(q) || r.slug.includes(q))
      .slice(0, 6);
  }, [mentionQuery, roster, currentSlug]);

  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
    void markChatReadAction();
  }, []);

  // Poll for messages from everyone else (and mark read again each cycle,
  // so a mention that arrives while this tab is already open doesn't leave
  // the Nav badge stuck on).
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const after = latestCreatedAtRef.current;
        const res = await fetch(`/api/chat/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`);
        if (!res.ok) return;
        const data: {
          messages: PostedMessage[];
          reactionUpdates: Record<string, ReactionSummary[]>;
          presence: Presence;
        } = await res.json();
        setPresence(data.presence);
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m) => !seen.has(m.id));
          // Refresh reactions on already-loaded messages (reacting doesn't
          // bump createdAt, so this is the only way someone else's reaction
          // shows up without a full reload) before appending anything new.
          const withFreshReactions = prev.map((m) =>
            data.reactionUpdates[m.id] ? { ...m, reactions: data.reactionUpdates[m.id] } : m
          );
          if (fresh.length === 0) return withFreshReactions;
          return [...withFreshReactions, ...fresh];
        });
        if (data.messages.length > 0) latestCreatedAtRef.current = data.messages.at(-1)!.createdAt;
        void markChatReadAction();
      } catch {
        // transient network hiccup - next tick tries again
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function updateMentionState(value: string, caret: number) {
    const upToCaret = value.slice(0, caret);
    const match = upToCaret.match(/@([a-z0-9-]*)$/i);
    setMentionQuery(match ? match[1] : null);
    setMentionIndex(0);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    updateMentionState(value, e.target.selectionStart ?? value.length);
    pingTyping(value.length > 0);
  }

  // Debounced typing heartbeat: while actively composing, ping at most
  // once every ~1.5s (not on every keystroke) - cleared immediately (no
  // debounce) the moment the box empties out or a message sends.
  function pingTyping(isTyping: boolean) {
    if (!isTyping) {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        void setTypingAction(false);
      }
      return;
    }
    const now = Date.now();
    isTypingRef.current = true;
    if (now - lastTypingPingRef.current > 1500) {
      lastTypingPingRef.current = now;
      void setTypingAction(true);
    }
  }

  function insertMention(entry: RosterEntry) {
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? text.length;
    const upToCaret = text.slice(0, caret);
    const replacedStart = upToCaret.replace(/@([a-z0-9-]*)$/i, `@${entry.slug} `);
    const next = replacedStart + text.slice(caret);
    setText(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = replacedStart.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function send() {
    let body = text.trim();
    if (!body || sending) return;
    // /flex: a fun slash command, not a real message the user typed -
    // built entirely from the roster already loaded client-side, so it
    // works instantly with no extra round trip.
    if (/^\/flex$/i.test(body)) {
      const me = rosterBySlug.get(currentSlug);
      if (me) {
        body = `🏆 ${me.displayName} ("${me.codename}") is flexing: ${me.tierLabel} clearance, ${me.xp} XP. Try to keep up.`;
      }
    }
    setSending(true);
    setError(null);
    const result = await postChatMessageAction(body);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setText("");
    setMentionQuery(null);
    pingTyping(false);
    stickToBottomRef.current = true;
    setMessages((prev) => (prev.some((m) => m.id === result.message.id) ? prev : [...prev, result.message]));
    latestCreatedAtRef.current = result.message.createdAt;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionSuggestions[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    const result = await deleteChatMessageAction(id);
    if (result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } else {
      alert(result.error);
    }
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    const result = await toggleReactionAction(messageId, emoji);
    if (result.ok) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: result.reactions } : m)));
    }
  }

  return (
    <div className="flex h-[calc(100vh-340px)] min-h-[360px] flex-col">
      {presence.online.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 font-terminal text-[10px] uppercase tracking-wide text-brand-sand/40">
          <span className="flex items-center gap-1 text-emerald-400/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> online now
          </span>
          {presence.online.map((p) => (
            <span key={p.slug} className="text-brand-sand/60">
              {p.displayName}
            </span>
          ))}
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="surface-card mb-3 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
      >
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-brand-sand/40">
            Nobody&apos;s said anything yet. Break the ice.
          </p>
        )}
        {messages.map((m) => {
          if (m.authorIsSystem) {
            return (
              <div key={m.id} className="flex items-center justify-center gap-2 py-0.5">
                <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1 font-terminal text-[10px] uppercase tracking-wide text-brand-cyan/80">
                  {m.body}
                </span>
              </div>
            );
          }
          const mentionsMe = mentionsSlug(m.body, currentSlug);
          const canDelete = isAdmin || m.employeeSlug === currentSlug;
          const isRogue = m.authorIsRogue;
          const authorEntry = rosterBySlug.get(m.employeeSlug);
          return (
            <div
              key={m.id}
              className={`group relative flex gap-3 rounded-xl p-2 ${
                isRogue
                  ? "my-1.5 rogue-flicker border border-brand-red/40 bg-brand-red/[0.07] shadow-[0_0_18px_-4px_var(--brand-red)]"
                  : mentionsMe
                    ? "-m-2 bg-brand-cyan/10 ring-1 ring-brand-cyan/30"
                    : "-m-2"
              }`}
            >
              {isRogue && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                  <div className="process420-watermark text-[2.2rem] opacity-[0.08]">PROCESS_420</div>
                </div>
              )}
              <Avatar slug={m.employeeSlug} name={m.employeeName} isRogue={isRogue} />
              <div className="relative min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2">
                  <AgentLink
                    slug={m.employeeSlug}
                    rosterBySlug={rosterBySlug}
                    className={`flex items-center gap-1 text-sm font-semibold hover:text-brand-yellow ${
                      isRogue ? "glitch-text text-brand-red" : ""
                    }`}
                  >
                    {isRogue ? (
                      <Icon name="skull" className="h-3.5 w-3.5" />
                    ) : (
                      authorEntry && (
                        <Icon
                          name={authorEntry.iconOverride ?? authorEntry.tierIcon}
                          className="h-3.5 w-3.5"
                          style={{ color: authorEntry.outlineColor ?? authorEntry.tierColor }}
                        />
                      )
                    )}
                    <span style={!isRogue && authorEntry ? { color: authorEntry.outlineColor ?? authorEntry.tierColor } : undefined}>
                      {m.employeeName}
                    </span>
                  </AgentLink>
                  {isRogue && (
                    <span className="font-terminal text-[9px] uppercase tracking-widest text-brand-red/70">
                      ⚠ untraceable
                    </span>
                  )}
                  <span className="font-terminal text-[10px] text-brand-sand/35">{formatTime(m.createdAt)}</span>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="ml-auto font-terminal text-[10px] uppercase text-brand-sand/0 transition group-hover:text-brand-red/70 hover:!text-brand-red"
                    >
                      delete
                    </button>
                  )}
                </div>
                <MessageBody body={m.body} slugToName={slugToName} rosterBySlug={rosterBySlug} />
                <Reactions messageId={m.id} reactions={m.reactions} onToggle={handleToggleReaction} />
              </div>
            </div>
          );
        })}
      </div>

      {presence.typing.length > 0 && (
        <p className="-mt-2 mb-2 px-1 font-terminal text-[10px] italic text-brand-sand/40">
          {presence.typing.map((p) => p.displayName).join(", ")}
          {presence.typing.length === 1 ? " is" : " are"} typing...
        </p>
      )}

      {error && <div className="mb-2 rounded-lg bg-brand-red/15 px-3 py-2 text-xs text-brand-red">{error}</div>}

      <div className="relative">
        {mentionQuery !== null && mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 z-10 mb-1.5 w-64 overflow-hidden rounded-xl border border-brand-sand/15 bg-brand-dark-green shadow-xl">
            {mentionSuggestions.map((entry, i) => (
              <button
                key={entry.slug}
                type="button"
                onClick={() => insertMention(entry)}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === mentionIndex ? "bg-brand-cyan/15 text-brand-sand" : "text-brand-sand/70 hover:bg-brand-sand/5"
                }`}
              >
                {entry.displayName} <span className="text-brand-sand/35">@{entry.slug}</span>
              </button>
            ))}
          </div>
        )}
        <div className="surface-card flex items-end gap-2 p-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={(e) => updateMentionState(text, e.currentTarget.selectionStart ?? text.length)}
            rows={2}
            maxLength={CHAT_MAX_LENGTH}
            placeholder="Say something... type @ to mention someone. Enter to send, Shift+Enter for a new line."
            className="input-modern w-full flex-1 resize-none"
          />
          <button
            onClick={() => void send()}
            disabled={sending || !text.trim()}
            className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
