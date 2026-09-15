"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB — small headshots only, keeps the DB lean.
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadPhotoAction(formData: FormData) {
  const identity = await getAgentIdentity();
  if (!identity) {
    redirect("/identify?next=/profile");
  }
  const email = identity!.email;
  const profileUrl = `/profile/${encodeURIComponent(email)}`;

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${profileUrl}?photoError=${encodeURIComponent("Please choose an image file.")}`);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    redirect(
      `${profileUrl}?photoError=${encodeURIComponent("Unsupported file type \u2014 use JPG, PNG, WEBP, or GIF.")}`
    );
  }

  if (file.size > MAX_BYTES) {
    redirect(`${profileUrl}?photoError=${encodeURIComponent("Image is too large \u2014 please use one under 2MB.")}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.employee.update({
    where: { email },
    data: { photo: buffer, photoMimeType: file.type, photoUpdatedAt: new Date() },
  });

  revalidatePath("/leaderboard");
  revalidatePath(profileUrl);
  redirect(`${profileUrl}?photoUploaded=1`);
}

export async function removePhotoAction() {
  const identity = await getAgentIdentity();
  if (!identity) {
    redirect("/identify?next=/profile");
  }
  const email = identity!.email;
  const profileUrl = `/profile/${encodeURIComponent(email)}`;

  await prisma.employee.update({
    where: { email },
    data: { photo: null, photoMimeType: null, photoUpdatedAt: null },
  });

  revalidatePath("/leaderboard");
  revalidatePath(profileUrl);
  redirect(`${profileUrl}?photoRemoved=1`);
}
