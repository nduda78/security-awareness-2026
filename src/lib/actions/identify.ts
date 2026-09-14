"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { encodeAgentCookie, AGENT_COOKIE_NAME } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@dutchie\.com$/i;

export async function identifyAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/leaderboard");

  const errors: string[] = [];
  if (!name) errors.push("Name is required.");
  if (!EMAIL_RE.test(emailRaw)) errors.push("Enter a valid @dutchie.com email address.");

  if (errors.length > 0) {
    redirect(`/identify?next=${encodeURIComponent(next)}&error=${encodeURIComponent(errors.join(" "))}`);
  }

  await prisma.employee.upsert({
    where: { email: emailRaw },
    update: { displayName: name },
    create: { email: emailRaw, displayName: name },
  });

  const store = await cookies();
  store.set(AGENT_COOKIE_NAME, encodeAgentCookie({ email: emailRaw, displayName: name }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 120,
  });

  redirect(next.startsWith("/") ? next : "/leaderboard");
}

export async function signOutAction() {
  const store = await cookies();
  store.delete(AGENT_COOKIE_NAME);
  redirect("/leaderboard");
}
