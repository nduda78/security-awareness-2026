"use client";

import { resetPinAction } from "@/lib/actions/admin";

// Tiny client-side wrapper just for the confirm() dialog - resetPinAction
// itself stays a plain server action, this only needs 'use client' because
// server components can't attach onSubmit handlers directly.
export function ResetPinButton({ email, displayName }: { email: string; displayName: string }) {
  return (
    <form
      action={resetPinAction}
      onSubmit={(e) => {
        if (!confirm(`Reset ${displayName}'s PIN? They'll need to set a new one via the New Agent tab.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="email" value={email} />
      <button className="btn-secondary !px-2 !py-0.5 !text-[10px]">Reset PIN</button>
    </form>
  );
}
