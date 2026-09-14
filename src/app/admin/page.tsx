import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { adminLoginAction } from "@/lib/actions/admin";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminSession()) redirect("/admin/challenges");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl border border-brand-purple/40 bg-black/30 p-6">
        <div className="mb-1 font-terminal text-xs uppercase tracking-widest text-brand-purple">
          Security Team Only
        </div>
        <h2 className="mb-4 text-xl font-bold">Admin Access</h2>
        {error && <div className="mb-4 rounded bg-brand-red/15 p-2 text-sm text-brand-red">{error}</div>}
        <form action={adminLoginAction} className="space-y-4">
          <input
            type="password"
            name="passphrase"
            placeholder="Passphrase"
            required
            className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
          />
          <button className="w-full rounded-md bg-brand-purple py-2 font-terminal text-sm uppercase text-brand-sand">
            Unlock Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
}
