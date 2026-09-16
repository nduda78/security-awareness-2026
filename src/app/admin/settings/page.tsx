import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { isCompromisedModeEnabled, getClearanceWebhookConfig } from "@/lib/settings";
import { toggleCompromisedModeAction, saveClearanceWebhookAction } from "@/lib/actions/admin";
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
  const clearanceWebhook = await getClearanceWebhookConfig();

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

      <div className="surface-card mt-6 max-w-xl space-y-4 p-5">
        <div className="flex items-center gap-2 text-brand-cyan">
          <Icon name="lock" className="h-4 w-4" />
          <span className="section-eyebrow !text-brand-cyan">Integration</span>
        </div>
        <h2 className="font-display text-lg font-semibold">Clearance Upgrade Webhook</h2>
        <p className="text-sm text-brand-sand/60">
          POSTs a JSON payload (agent, previous tier, new tier, XP) to this URL every time any agent&apos;s
          security clearance goes up a level - separate from the per-challenge webhook on the Challenges page,
          which fires per-completion instead.
        </p>
        <form action={saveClearanceWebhookAction} className="space-y-3">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={clearanceWebhook.enabled}
              className="h-4 w-4 accent-brand-cyan"
            />
            <span className="font-terminal text-xs uppercase tracking-wide text-brand-sand/70">
              Enable clearance upgrade webhook
            </span>
          </label>
          <input
            name="url"
            type="url"
            defaultValue={clearanceWebhook.url ?? ""}
            placeholder="https://your-tines-webhook-url..."
            className="input-modern w-full"
          />
          <button className="btn-secondary !border-brand-cyan/40 !text-brand-cyan">Save</button>
        </form>
        <p className="font-terminal text-[10px] uppercase tracking-wide text-brand-sand/35">
          Currently:{" "}
          <span className={clearanceWebhook.enabled && clearanceWebhook.url ? "text-brand-cyan" : "text-brand-sand/50"}>
            {clearanceWebhook.enabled && clearanceWebhook.url ? "ENABLED" : "off"}
          </span>
        </p>
      </div>
    </div>
  );
}
