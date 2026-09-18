"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { hashPin, verifyPin, isValidVaultPassword } from "@/lib/auth";

/**
 * Self-service set/change of the signed-in admin's own vault password
 * (Employee.extraPasswordHash) - lets someone who was JUST promoted via
 * toggleAdminAction set theirs immediately, in-session, rather than
 * waiting for their next sign-in to be forced through the setup-vault
 * login step (see loginAction/setupVaultPasswordAction in identify.ts).
 * Also doubles as "change my password" for anyone who already has one.
 *
 * Requires a live agent session (not just the legacy admin_session
 * passphrase cookie, which has no employee identity to attach a password
 * to) and re-checks isAdmin server-side - the Settings page only shows
 * this form at all when the signed-in identity is genuinely isAdmin, but
 * the action doesn't trust that alone.
 */
export async function setOwnAdminPasswordAction(formData: FormData) {
  const identity = await getAgentIdentity();
  if (!identity) redirect("/identify?next=/admin/settings");

  const employee = await prisma.employee.findUnique({ where: { email: identity!.email } });
  if (!employee || !employee.isAdmin) {
    redirect("/admin/settings?pwError=" + encodeURIComponent("Only admin accounts can set this."));
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Only demand the current password if one is already set - someone who
  // was just promoted and never got a chance to set one yet (e.g. shown
  // this form for the first time in the same session as their promotion)
  // has nothing to prove yet.
  if (employee!.extraPasswordHash && !verifyPin(currentPassword, employee!.extraPasswordHash)) {
    redirect("/admin/settings?pwError=" + encodeURIComponent("Current password is incorrect."));
  }

  if (!isValidVaultPassword(newPassword)) {
    redirect("/admin/settings?pwError=" + encodeURIComponent("New password must be at least 6 characters."));
  }
  if (newPassword !== confirmPassword) {
    redirect("/admin/settings?pwError=" + encodeURIComponent("New passwords don't match."));
  }

  await prisma.employee.update({
    where: { email: employee!.email },
    data: { extraPasswordHash: hashPin(newPassword) },
  });

  redirect("/admin/settings?pwSaved=1");
}
