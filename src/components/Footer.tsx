import Image from "next/image";

export function Footer({ compromised = false }: { compromised?: boolean }) {
  return (
    <footer className="border-t border-brand-sand/10 bg-black/20 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 opacity-60">
          <Image src="/brand/dutchie-logo.png" alt="Dutchie" width={72} height={20} className="h-4 w-auto" />
        </div>
        <p className="font-terminal text-[10px] uppercase tracking-widest text-brand-sand/30">
          {compromised
            ? "CONNECTION UNSTABLE — INTEGRITY CHECK FAILED — ROOT ACCESS GRANTED TO UNKNOWN PARTY"
            : "Classified — Dutchie Internal Use Only — 2026 Security Awareness Month"}
        </p>
      </div>
    </footer>
  );
}
