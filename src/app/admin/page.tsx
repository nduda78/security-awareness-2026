import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { adminLoginAction } from "@/lib/actions/admin";
import { Icon } from "@/components/Icon";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminSession()) redirect("/admin/challenges");
  const { error } = await searchParams;

  return (
    <div className="fade-in-up mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center">
      <div className="glass-panel w-full rounded-2xl p-7">
        <div className="mb-3 flex items-center gap-2 text-brand-purple">
          <Icon name="lock" className="h-4 w-4" />
          <span className="section-eyebrow !text-brand-purple">Security Team Only</span>
        </div>
        <h1 className="mb-4 font-display text-xl font-semibold">Admin Access</h1>
        {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}
        <form action={adminLoginAction} className="space-y-4">
          <input
            type="password"
            name="passphrase"
            placeholder="Passphrase"
            required
            className="input-modern w-full"
          />
          <button
            className="btn-primary w-full"
            style={{
              background: "linear-gradient(135deg, var(--brand-purple), #401f36)",
              boxShadow: "0 6px 20px -6px rgba(94,50,78,0.6)",
              color: "var(--brand-sand)",
            }}
          >
            Unlock Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
}
