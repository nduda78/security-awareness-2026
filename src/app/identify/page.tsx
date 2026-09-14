import { identifyAction } from "@/lib/actions/identify";

export default async function IdentifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/leaderboard", error } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <div className="scanlines relative rounded-xl border border-brand-light-green/30 bg-black/30 p-6">
        <div className="mb-1 font-terminal text-xs uppercase tracking-widest text-brand-light-green">
          Access Request
        </div>
        <h2 className="mb-4 text-xl font-bold">Agent Identification Required</h2>
        <p className="mb-6 text-sm text-brand-sand/70">
          Enter your name and Dutchie email to open your file. No password needed — this is an internal
          engagement tool, not a real security boundary.
        </p>

        {error && <div className="mb-4 rounded bg-brand-red/15 p-2 text-sm text-brand-red">{error}</div>}

        <form action={identifyAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">Full name</label>
            <input
              name="name"
              required
              placeholder="Nick Duda"
              className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">
              Dutchie email
            </label>
            <input
              name="email"
              required
              type="email"
              placeholder="nick.duda@dutchie.com"
              className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
            />
          </div>
          <button className="w-full rounded-md bg-brand-light-green py-2 font-terminal text-sm uppercase text-brand-dark-green hover:brightness-110">
            Enter the Program
          </button>
        </form>
      </div>
    </div>
  );
}
