"use client";

import { deleteEmployeeAction } from "@/lib/actions/admin";

// Tiny client-side wrapper just for the confirm() dialog - deleteEmployeeAction
// itself stays a plain server action, this only needs 'use client' because
// server components can't attach onSubmit handlers directly. Deleting an
// employee is permanent (cascades to their submissions + badge flare, wiping
// their XP off the leaderboard entirely) with no in-app undo, so the confirm
// text spells out exactly what's about to happen rather than a generic
// "are you sure?" - the server action also independently re-blocks deleting
// the permanent admin or your own signed-in identity, so this dialog isn't
// the only line of defense.
export function DeleteEmployeeButton({ email, displayName }: { email: string; displayName: string }) {
  return (
    <form
      action={deleteEmployeeAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Permanently delete ${displayName} (${email})?\n\nThis removes their entire XP history, submissions, and badge customization. There is no undo in the app — only a manual db-backups/ restore could bring them back.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="email" value={email} />
      <button className="btn-secondary !border-brand-red/30 !px-2 !py-0.5 !text-[10px] !text-brand-red">
        Delete
      </button>
    </form>
  );
}
