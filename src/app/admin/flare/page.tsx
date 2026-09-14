import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { upsertFlareAction } from "@/lib/actions/admin";
import { BACKGROUND_EFFECTS, BORDER_STYLES, ICONS } from "@/lib/flare";

export const dynamic = "force-dynamic";

export default async function AdminFlarePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; saved?: string; error?: string }>;
}) {
  if (!(await isAdminSession())) redirect("/admin");
  const { email: selectedEmail, saved, error } = await searchParams;

  const employees = await prisma.employee.findMany({ orderBy: { displayName: "asc" }, include: { flare: true } });
  const selected = selectedEmail ? employees.find((e) => e.email === selectedEmail.toLowerCase()) : undefined;

  return (
    <div>
      <AdminNav />
      <h2 className="mb-6 text-2xl font-bold">Badge Flare</h2>
      {saved && <div className="mb-4 rounded bg-brand-light-green/15 p-2 text-sm text-brand-light-green">Saved.</div>}
      {error && <div className="mb-4 rounded bg-brand-red/15 p-2 text-sm text-brand-red">{error}</div>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-1">
          {employees.map((e) => (
            <a
              key={e.email}
              href={`/admin/flare?email=${encodeURIComponent(e.email)}`}
              className={`block rounded px-3 py-2 text-sm ${
                selected?.email === e.email ? "bg-brand-purple/30" : "hover:bg-black/20"
              }`}
            >
              {e.displayName}
              {e.flare && <span className="ml-2 text-brand-yellow">●</span>}
            </a>
          ))}
        </div>

        <div>
          {!selected ? (
            <p className="text-sm text-brand-sand/50">Pick an employee on the left to edit their flare.</p>
          ) : (
            <form action={upsertFlareAction} className="space-y-4">
              <input type="hidden" name="email" value={selected.email} />
              <div>
                <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">
                  Achievements (one per line)
                </label>
                <textarea
                  name="achievements"
                  rows={3}
                  defaultValue={selected.flare?.achievements.join("\n")}
                  className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Outline color" name="outlineColor" defaultValue={selected.flare?.outlineColor ?? ""} placeholder="Hot Pink, #ff0, royalblue" />
                <TextField label="Background color" name="backgroundColor" defaultValue={selected.flare?.backgroundColor ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Background effect"
                  name="backgroundEffect"
                  defaultValue={selected.flare?.backgroundEffect ?? ""}
                  options={["", ...BACKGROUND_EFFECTS]}
                />
                <SelectField
                  label="Border style"
                  name="borderStyle"
                  defaultValue={selected.flare?.borderStyle ?? ""}
                  options={["", ...BORDER_STYLES]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Icon override"
                  name="iconOverride"
                  defaultValue={selected.flare?.iconOverride ?? ""}
                  options={["", ...ICONS]}
                />
                <TextField label="Ribbon text" name="ribbonText" defaultValue={selected.flare?.ribbonText ?? ""} placeholder="Gold, or an inside joke" />
              </div>
              <TextField label="Codename override" name="codenameOverride" defaultValue={selected.flare?.codenameOverride ?? ""} />
              <TextField label="Motto / tagline" name="motto" defaultValue={selected.flare?.motto ?? ""} />
              <TextField label="Name suffix" name="nameSuffix" defaultValue={selected.flare?.nameSuffix ?? ""} placeholder="the Master" />
              <TextField
                label="Expires at"
                name="expiresAt"
                type="datetime-local"
                defaultValue={selected.flare?.expiresAt ? selected.flare.expiresAt.toISOString().slice(0, 16) : ""}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="pinned" defaultChecked={selected.flare?.pinned ?? false} />
                Pin to top of tier
              </label>
              <button className="rounded-md bg-brand-purple px-4 py-2 font-terminal text-xs uppercase text-brand-sand">
                Save flare
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "(none)"}
          </option>
        ))}
      </select>
    </div>
  );
}
