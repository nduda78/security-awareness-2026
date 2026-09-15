import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { upsertFlareAction } from "@/lib/actions/admin";
import { BACKGROUND_EFFECTS, BORDER_STYLES, ICONS } from "@/lib/flare";
import { ColorField } from "@/components/ColorField";

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
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Badge Flare</h1>
      {saved && (
        <div className="mb-4 rounded-xl bg-brand-light-green/15 p-3 text-sm text-brand-light-green">Saved.</div>
      )}
      {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="surface-card space-y-1 p-2">
          {employees.map((e) => (
            <a
              key={e.email}
              href={`/admin/flare?email=${encodeURIComponent(e.email)}`}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                selected?.email === e.email
                  ? "bg-brand-purple/25 text-brand-sand"
                  : "text-brand-sand/70 hover:bg-brand-sand/5 hover:text-brand-sand"
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
            <form action={upsertFlareAction} className="surface-card space-y-4 p-5">
              <input type="hidden" name="email" value={selected.email} />
              <div>
                <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
                  Achievements (one per line)
                </label>
                <textarea
                  name="achievements"
                  rows={3}
                  defaultValue={selected.flare?.achievements.join("\n")}
                  className="input-modern w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ColorField label="Outline color" name="outlineColor" defaultValue={selected.flare?.outlineColor ?? ""} placeholder="#ff6a00, hotpink, royalblue" />
                <ColorField label="Background color" name="backgroundColor" defaultValue={selected.flare?.backgroundColor ?? ""} />
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
              <label className="flex items-center gap-2 text-sm text-brand-sand/70">
                <input
                  type="checkbox"
                  name="pinned"
                  defaultChecked={selected.flare?.pinned ?? false}
                  className="accent-brand-purple"
                />
                Pin to top of tier
              </label>
              <button
                className="btn-primary"
                style={{ background: "linear-gradient(135deg, var(--brand-purple), #401f36)", color: "var(--brand-sand)" }}
              >
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
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} className="input-modern w-full" />
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
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      <select name={name} defaultValue={defaultValue} className="input-modern w-full">
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "(none)"}
          </option>
        ))}
      </select>
    </div>
  );
}
