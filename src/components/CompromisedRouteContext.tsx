"use client";

import { createContext, useContext, useLayoutEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Drives the site-wide "compromised" glitch theme from TWO independent
// sources instead of just the one admin-controlled global toggle
// (settings.ts): the real global setting (baseCompromised, computed
// server-side in layout.tsx, unaffected by any of this), OR simply
// having a specific route open right now (FORCED_COMPROMISED_ROUTES) -
// e.g. Security Connections #3, whose whole Process 420 mission
// briefing/win text is written as an in-universe "you've been
// compromised" moment. This is deliberately per-viewer and per-page: it
// never writes to the database, never affects any other employee's
// session, and reverts the instant this viewer navigates away (unless
// the real global toggle is also on, in which case it stays on exactly
// like it always did).
export const FORCED_COMPROMISED_ROUTES = ["/challenges/security-connections-3"];

const CompromisedRouteContext = createContext<boolean>(false);

export function CompromisedRouteProvider({
  baseCompromised,
  children,
}: {
  baseCompromised: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const effective = baseCompromised || FORCED_COMPROMISED_ROUTES.includes(pathname);

  // The <html> element's class is rendered server-side from baseCompromised
  // alone (layout.tsx has no idea what route is being requested at that
  // point) - this corrects it on the client for the route-forced case,
  // and un-does it again the moment the viewer navigates away. Runs
  // before paint (useLayoutEffect, not useEffect) to keep the flash on
  // entering/leaving the forced route as brief as possible.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("site-compromised", effective);
  }, [effective]);

  return <CompromisedRouteContext.Provider value={effective}>{children}</CompromisedRouteContext.Provider>;
}

/** The effective compromised state for the current viewer/route - global toggle OR currently on a forced route. */
export function useCompromisedRoute(): boolean {
  return useContext(CompromisedRouteContext);
}

/** Renders children only while the effective compromised state is on - mounts/unmounts (not just visually hides), so effects like VirusOverlay's periodic glitch pulse actually start/stop with it. */
export function CompromisedOnly({ children }: { children: ReactNode }) {
  const compromised = useCompromisedRoute();
  if (!compromised) return null;
  return <>{children}</>;
}
