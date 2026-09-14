import { redirect } from "next/navigation";
import { getAgentIdentity } from "@/lib/session";

export default async function MyProfilePage() {
  const identity = await getAgentIdentity();
  if (!identity) redirect("/identify?next=/profile");
  redirect(`/profile/${encodeURIComponent(identity.email)}`);
}
