"use client";

import { useRef } from "react";
import { BadgeCard } from "./BadgeCard";
import { DownloadBadgeButton } from "./DownloadBadgeButton";
import type { ClientAgentCard } from "@/lib/client-types";

// Thin client wrapper so BadgeCard and DownloadBadgeButton can share one
// ref to the front-face card DOM node - profile/[email]/page.tsx itself is
// a server component and can't own a ref directly.
export function ProfileBadgeWithDownload({
  card,
  showProfileLink,
}: {
  card: ClientAgentCard;
  showProfileLink: boolean;
}) {
  const frontRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <BadgeCard card={card} showProfileLink={showProfileLink} frontCaptureRef={frontRef} />
      <DownloadBadgeButton targetRef={frontRef} fileNameBase={card.email} />
    </div>
  );
}
