"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encodeRogueCookie, ROGUE_COOKIE_NAME } from "@/lib/session";

// Deliberately unmemorable-sounding: this is a deterrent, not real
// security — but since this app has a real backend (unlike the old static
// build), the ROGUE roster is genuinely never sent to the browser at all
// until this cookie is set server-side. No client-side crypto needed.
export async function unlockRogueAction(formData: FormData) {
  const passphrase = String(formData.get("passphrase") ?? "");
  const next = String(formData.get("next") ?? "/leaderboard");

  if (passphrase !== (process.env.ROGUE_PASSPHRASE || "")) {
    redirect(`${next}?rogueError=1`);
  }

  const store = await cookies();
  store.set(ROGUE_COOKIE_NAME, encodeRogueCookie(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  redirect(next);
}
