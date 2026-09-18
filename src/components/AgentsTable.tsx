"use client";

import { useMemo, useState } from "react";
import { ResetPinButton } from "./ResetPinButton";
import { DeleteEmployeeButton } from "./DeleteEmployeeButton";

export interface AgentRow {
  email: string;
  displayName: string;
  xp: number;
  tierLabel: string;
  tierColor: string;
  tierOrder: number;
  rogueOverride: boolean;
  hidden: boolean;
  claimed: boolean;
  isAdmin: boolean;
  /// True if this admin-flagged agent has already set their vault
  /// password (Employee.extraPasswordHash) - only meaningful when
  /// isAdmin is true; ignored otherwise.
  hasAdminPassword: boolean;
}

type SortKey = "name" | "handle" | "xp" | "tier";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "handle", label: "Handle" },
  { key: "xp", label: "XP" },
  { key: "tier", label: "Tier" },
];

function compare(a: AgentRow, b: AgentRow, key: SortKey): number {
  switch (key) {
    case "name":
      return a.displayName.localeCompare(b.displayName);
    case "handle":
      return a.email.localeCompare(b.email);
    case "xp":
      return a.xp - b.xp;
    case "tier":
      // Lower TierDef.order = higher clearance (ROGUE first) - sorting by
      // it directly matches the same "highest clearance first" ordering
      // used everywhere else in the app, not a plain XP proxy.
      return a.tierOrder - b.tierOrder;
  }
}

/**
 * Client-side search + sortable columns for the Agents admin table - no
 * server round trip for either, since the whole roster is small and
 * already fully loaded. Rows are plain serializable data; the actual
 * per-row actions (toggle forms, grant XP, reset PIN, delete) are passed
 * in as server action props from the page and rendered here alongside
 * them, so this component owns the search/sort UI without needing to
 * duplicate any of that action wiring.
 */
export function AgentsTable({
  rows,
  permanentAdminEmail,
  currentEmail,
  toggleRogueAction,
  toggleHiddenAction,
  grantManualXpAction,
  toggleAdminAction,
}: {
  rows: AgentRow[];
  permanentAdminEmail: string;
  currentEmail: string | null;
  toggleRogueAction: (formData: FormData) => void;
  toggleHiddenAction: (formData: FormData) => void;
  grantManualXpAction: (formData: FormData) => void;
  toggleAdminAction: (formData: FormData) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("xp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => r.displayName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
      : rows;
    const sorted = [...filtered].sort((a, b) => compare(a, b, sortKey) * (sortDir === "asc" ? 1 : -1));
    return sorted;
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "xp" || key === "tier" ? "desc" : "asc");
    }
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find an agent by name or handle..."
        className="input-modern mb-3 w-full sm:max-w-sm"
      />
      <p className="mb-3 font-terminal text-[11px] text-brand-sand/35">
        {visible.length} of {rows.length} agents
      </p>
      <div className="surface-card overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-sand/10 text-left font-terminal text-[11px] uppercase tracking-wide text-brand-sand/40">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 uppercase tracking-wide text-brand-sand/40 hover:text-brand-sand"
                  >
                    {col.label}
                    {sortKey === col.key && <span className="text-brand-cyan">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
              <th className="px-3 py-3">ROGUE override</th>
              <th className="px-3 py-3">Hide from Leaderboard</th>
              <th className="px-3 py-3">Manual XP grant</th>
              <th className="px-3 py-3">PIN</th>
              <th className="px-3 py-3">Admin</th>
              <th className="px-3 py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-brand-sand/40">
                  No agents match &quot;{query}&quot;.
                </td>
              </tr>
            )}
            {visible.map((r) => (
              <tr key={r.email} className="border-b border-brand-sand/5 last:border-0">
                <td className="px-3 py-2.5 font-medium text-brand-sand">{r.displayName}</td>
                <td className="px-3 py-2.5 text-brand-sand/50">{r.email}</td>
                <td className="px-3 py-2.5 font-terminal">{r.xp}</td>
                <td className="px-3 py-2.5 font-terminal text-xs uppercase" style={{ color: r.tierColor }}>
                  {r.tierLabel}
                </td>
                <td className="px-3 py-2.5">
                  <form action={toggleRogueAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="email" value={r.email} />
                    <input type="checkbox" name="rogue" defaultChecked={r.rogueOverride} className="accent-brand-red" />
                    <button className="btn-secondary !border-brand-red/30 !px-2 !py-0.5 !text-[10px] !text-brand-red">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2.5">
                  <form action={toggleHiddenAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="email" value={r.email} />
                    <input type="checkbox" name="hidden" defaultChecked={r.hidden} className="accent-brand-cyan" />
                    <button className="btn-secondary !border-brand-cyan/30 !px-2 !py-0.5 !text-[10px] !text-brand-cyan">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2.5">
                  <form action={grantManualXpAction} className="flex gap-1">
                    <input type="hidden" name="email" value={r.email} />
                    <input name="xp" type="number" placeholder="XP" className="input-modern w-16 !px-2 !py-1 !text-xs" />
                    <input name="reason" placeholder="reason" className="input-modern w-24 !px-2 !py-1 !text-xs" />
                    <button className="btn-primary !px-2 !py-1 !text-[10px]">Grant</button>
                  </form>
                </td>
                <td className="px-3 py-2.5">
                  {r.claimed ? (
                    <ResetPinButton email={r.email} displayName={r.displayName} />
                  ) : (
                    <span className="font-terminal text-[10px] uppercase text-brand-sand/35">Unclaimed</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {r.email === permanentAdminEmail ? (
                    <span className="font-terminal text-[10px] uppercase text-brand-light-green/80">Permanent</span>
                  ) : (
                    <div className="space-y-1">
                      <form action={toggleAdminAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="email" value={r.email} />
                        <input
                          type="checkbox"
                          name="admin"
                          defaultChecked={r.isAdmin}
                          className="accent-brand-light-green"
                        />
                        <button className="btn-secondary !px-2 !py-0.5 !text-[10px]">Save</button>
                      </form>
                      {r.isAdmin && !r.hasAdminPassword && (
                        <div
                          className="font-terminal text-[9px] uppercase text-brand-red/80"
                          title="They'll be prompted to set one on their next sign-in, or can set it now from /admin/settings."
                        >
                          ⚠ no password set
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {r.email === permanentAdminEmail || r.email === currentEmail ? (
                    <span className="font-terminal text-[10px] uppercase text-brand-sand/25">—</span>
                  ) : (
                    <DeleteEmployeeButton email={r.email} displayName={r.displayName} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
