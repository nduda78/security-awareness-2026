import { NextRequest, NextResponse } from "next/server";

// Lightweight presence check only (no HMAC verify here — middleware runs on
// the edge runtime and we keep verification, which needs Node's crypto, in
// the actual route/server-action code via getAgentIdentity()). This just
// avoids bouncing every request through a page render before redirecting.
const AGENT_COOKIE = "agent_session";

const PUBLIC_PREFIXES = ["/identify", "/admin", "/_next", "/favicon", "/api"];

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
