import Image from "next/image";
import { identifyAction } from "@/lib/actions/identify";
import { Icon } from "@/components/Icon";

export default async function IdentifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/leaderboard", error } = await searchParams;

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
          Enter your name and Dutchie email to open your file. No password needed — this is an internal
          engagement tool, not a real security boundary.
        </p>

        {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

        <form action={identifyAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Full name</label>
            <input name="name" required placeholder="Nick Duda" className="input-modern w-full" />
          </div>
          <div>
            <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
              Dutchie email
            </label>
            <input
              name="email"
              required
              type="email"
              placeholder="nick.duda@dutchie.com"
              className="input-modern w-full"
            />
          </div>
          <button className="btn-primary w-full">Enter the Program</button>
        </form>
      </div>
    </div>
  );
}
