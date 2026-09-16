import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { isCompromisedModeEnabled } from "@/lib/settings";
import { toggleCompromisedModeAction } from "@/lib/actions/admin";
import { AdminNav } from "@/components/AdminNav";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  if (!(await isAdminSession())) redirect("/admin");
  const { saved } = await searchParams;
  const compromised = await isCompromisedModeEnabled();

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Site Settings</h1>
      {saved && <div className="mb-4 rounded-xl bg-brand-light-green/15 p-3 text-sm text-brand-light-green">Saved.</div>}

      <div className="surface-card max-w-xl space-y-4 p-5">
        <div className="flex items-center gap-2 text-brand-red">
          <Icon name="skull" className="h-4 w-4" />
          <span className="section-eyebrow !text-brand-red">Experimental</span>
        </div>
        <h2 className="font-display text-lg font-semibold">Site-Wide Compromised Theme</h2>
        <p className="text-sm text-brand-sand/60">
          Cosmetic only. When enabled, the entire site (every visitor, every page) switches to a corrupted
          &quot;a virus took over the site&quot; look — glitch flicker, scanlines, a running breach ticker, RGB-split
          headings. No data changes, and nothing else about the app&apos;s behavior changes. Flip it back off any
          time to instantly restore the normal theme for everyone.
        </p>
        <form action={toggleCompromisedModeAction} className="flex items-center gap-3">
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="compromisedMode" defaultChecked={compromised} className="h-4 w-4 accent-brand-red" />
            <span className="font-terminal text-xs uppercase tracking-wide text-brand-sand/70">
              Enable compromised theme site-wide
            </span>
          </label>
          <button className="btn-secondary !border-brand-red/40 !text-brand-red">Save</button>
        </form>
        <p className="font-terminal text-[10px] uppercase tracking-wide text-brand-sand/35">
          Currently: <span className={compromised ? "text-brand-red" : "text-brand-light-green"}>{compromised ? "ENABLED" : "off"}</span>
        </p>
      </div>
    </div>
  );
}
