import { NextRequest, NextResponse } from "next/server";

// Lightweight presence check only (no HMAC verify here — middleware runs on
// the edge runtime and we keep verification, which needs Node's crypto, in
// the actual route/server-action code via getAgentIdentity()). This just
// avoids bouncing every request through a page render before redirecting.
const AGENT_COOKIE = "agent_session";

// /brand holds static logo assets — not sensitive, and Next's internal
// image-optimizer fetch for <Image> doesn't carry the browser's cookies,
// so gating it breaks logo rendering even for signed-in visitors. Deliberately
// NOT using a generic "has a file extension" bypass here: employee emails
// (e.g. /profile/name.last@dutchie.com) end in ".com" and would otherwise
// slip through the gate unauthenticated.
const PUBLIC_PREFIXES = ["/identify", "/admin", "/_next", "/favicon", "/api", "/brand"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasCookie = req.cookies.get(AGENT_COOKIE)?.value;
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/identify";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
