import Image from "next/image";
import Link from "next/link";
import { registerAction, loginAction, verifyVaultPasswordAction } from "@/lib/actions/identify";
import { Icon } from "@/components/Icon";

export default async function IdentifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mode?: string; step?: string }>;
}) {
  const { next = "/leaderboard", error, mode, step } = await searchParams;
  const isLogin = mode === "login";

  if (step === "vault") {
    return (
      <div className="fade-in-up mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center">
        <Image src="/brand/dutchie-logo.png" alt="Dutchie" width={140} height={38} className="mb-8 h-9 w-auto" />
        <div className="glass-panel w-full rounded-2xl p-7">
          <div className="mb-3 flex items-center gap-2 text-brand-red">
            <Icon name="lock" className="h-4 w-4" />
            <span className="section-eyebrow !text-brand-red">Additional Verification Required</span>
          </div>
          <h1 className="mb-3 font-display text-2xl font-semibold">Thought you were clever, huh?</h1>
          <p className="mb-6 text-sm text-brand-sand/60">
            That PIN was correct. This particular identity needs one more thing before it lets you in.
          </p>
          {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}
          <form action={verifyVaultPasswordAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Password</label>
              <input
                name="password"
                required
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-modern w-full"
                autoFocus
              />
            </div>
            <button className="btn-primary w-full">Continue</button>
          </form>
          <Link
            href={`/identify?mode=login&next=${encodeURIComponent(next)}`}
            className="mt-4 block text-center text-xs text-brand-sand/40 hover:text-brand-sand/60"
          >
            ← back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center">
      <Image src="/brand/dutchie-logo.png" alt="Dutchie" width={140} height={38} className="mb-8 h-9 w-auto" />
      <div className="glass-panel w-full rounded-2xl p-7">
        <div className="mb-3 flex items-center gap-2 text-brand-light-green">
          <Icon name="shield" className="h-4 w-4" />
          <span className="section-eyebrow">Access Request</span>
        </div>
        <h1 className="mb-3 font-display text-2xl font-semibold">Agent Identification Required</h1>
        <p className="mb-6 text-sm text-brand-sand/60">
          Sign in with your name and a 4-digit PIN. No password needed beyond that — this is an
          internal engagement tool, not a real security boundary.
        </p>

        <div className="mb-5 flex gap-2">
          <Link
            href={`/identify?mode=register&next=${encodeURIComponent(next)}`}
            className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold transition ${
              !isLogin ? "bg-brand-light-green text-brand-dark-green" : "border border-brand-sand/15 text-brand-sand/50"
            }`}
          >
            New Agent
          </Link>
          <Link
            href={`/identify?mode=login&next=${encodeURIComponent(next)}`}
            className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold transition ${
              isLogin ? "bg-brand-light-green text-brand-dark-green" : "border border-brand-sand/15 text-brand-sand/50"
            }`}
          >
            Returning Agent
          </Link>
        </div>

        {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

        <form action={isLogin ? loginAction : registerAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
                First name
              </label>
              <input name="firstName" required placeholder="Nick" className="input-modern w-full" />
            </div>
            <div>
              <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
                Last name
              </label>
              <input name="lastName" required placeholder="Duda" className="input-modern w-full" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">4-digit PIN</label>
            <input
              name="pin"
              required
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="input-modern w-full text-center font-terminal tracking-widest"
            />
          </div>
          {!isLogin && (
            <div>
              <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
                Confirm PIN
              </label>
              <input
                name="confirmPin"
                required
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="••••"
                autoComplete="new-password"
                className="input-modern w-full text-center font-terminal tracking-widest"
              />
            </div>
          )}
          <button className="btn-primary w-full">
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
