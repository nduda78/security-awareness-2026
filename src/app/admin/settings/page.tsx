import { redirect } from "next/navigation";
import { isAdminSession, getAgentIdentity } from "@/lib/session";
import { isCompromisedModeEnabled, getClearanceWebhookConfig, getReviewWebhookConfig } from "@/lib/settings";
import { toggleCompromisedModeAction, saveClearanceWebhookAction, saveReviewWebhookAction } from "@/lib/actions/admin";
import { setOwnAdminPasswordAction } from "@/lib/actions/adminSecurity";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; pwSaved?: string; pwError?: string }>;
}) {
  if (!(await isAdminSession())) redirect("/admin");
  const { saved, pwSaved, pwError } = await searchParams;
  const compromised = await isCompromisedModeEnabled();
  const clearanceWebhook = await getClearanceWebhookConfig();
  const reviewWebhook = await getReviewWebhookConfig();

  // Only a real signed-in agent identity flagged isAdmin has a password to
  // set here - the legacy admin_session passphrase cookie alone has no
  // employee row to attach one to.
  const identity = await getAgentIdentity();
  const selfEmployee = identity
    ? await prisma.employee.findUnique({ where: { email: identity.email }, select: { isAdmin: true, extraPasswordHash: true } })
    : null;
  const showPasswordPanel = !!selfEmployee?.isAdmin;
  const hasPasswordSet = !!selfEmployee?.extraPasswordHash;

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

      <div className="surface-card mt-6 max-w-xl space-y-4 p-5">
        <div className="flex items-center gap-2 text-brand-cyan">
          <Icon name="lock" className="h-4 w-4" />
          <span className="section-eyebrow !text-brand-cyan">Integration</span>
        </div>
        <h2 className="font-display text-lg font-semibold">Free Text Review Needed Webhook</h2>
        <p className="text-sm text-brand-sand/60">
          POSTs a JSON payload (agent, challenge, and their submitted answer) to this URL the moment a Free
          Text (manual review) submission lands in PENDING_REVIEW - so admins actually get notified instead of
          only finding out by checking the Answers page or Audit Log by hand. Fires exactly once per question
          (Free Text submissions are always one-shot).
        </p>
        <form action={saveReviewWebhookAction} className="space-y-3">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={reviewWebhook.enabled}
              className="h-4 w-4 accent-brand-cyan"
            />
            <span className="font-terminal text-xs uppercase tracking-wide text-brand-sand/70">
              Enable review-needed webhook
            </span>
          </label>
          <input
            name="url"
            type="url"
            defaultValue={reviewWebhook.url ?? ""}
            placeholder="https://your-tines-webhook-url..."
            className="input-modern w-full"
          />
          <button className="btn-secondary !border-brand-cyan/40 !text-brand-cyan">Save</button>
        </form>
        <p className="font-terminal text-[10px] uppercase tracking-wide text-brand-sand/35">
          Currently:{" "}
          <span className={reviewWebhook.enabled && reviewWebhook.url ? "text-brand-cyan" : "text-brand-sand/50"}>
            {reviewWebhook.enabled && reviewWebhook.url ? "ENABLED" : "off"}
          </span>
        </p>
      </div>

      {showPasswordPanel && (
        <div className="surface-card mt-6 max-w-xl space-y-4 p-5">
          <div className="flex items-center gap-2 text-brand-cyan">
            <Icon name="lock" className="h-4 w-4" />
            <span className="section-eyebrow !text-brand-cyan">Your Account</span>
          </div>
          <h2 className="font-display text-lg font-semibold">
            {hasPasswordSet ? "Change Your Admin Password" : "Set Your Admin Password"}
          </h2>
          <p className="text-sm text-brand-sand/60">
            Every admin-flagged account needs a password beyond their PIN to sign in (see
            Employee.extraPasswordHash) - if you were just promoted to admin, set yours here now instead of
            waiting for your next sign-in to be forced through it.
          </p>
          {pwSaved && (
            <div className="rounded-xl bg-brand-light-green/15 p-3 text-sm text-brand-light-green">Password saved.</div>
          )}
          {pwError && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{pwError}</div>}
          <form action={setOwnAdminPasswordAction} className="space-y-3">
            {hasPasswordSet && (
              <div>
                <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
                  Current password
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className="input-modern w-full"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
                {hasPasswordSet ? "New password" : "Password"}
              </label>
              <input
                name="newPassword"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="input-modern w-full"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
                Confirm {hasPasswordSet ? "new " : ""}password
              </label>
              <input
                name="confirmPassword"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="input-modern w-full"
                required
              />
            </div>
            <button className="btn-secondary !border-brand-cyan/40 !text-brand-cyan">
              {hasPasswordSet ? "Change password" : "Set password"}
            </button>
          </form>
          <p className="font-terminal text-[10px] uppercase tracking-wide text-brand-sand/35">
            Currently:{" "}
            <span className={hasPasswordSet ? "text-brand-light-green" : "text-brand-red"}>
              {hasPasswordSet ? "SET" : "NOT SET YET"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
