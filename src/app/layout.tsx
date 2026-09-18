import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Homemade_Apple } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { VirusOverlay } from "@/components/VirusOverlay";
import { isCompromisedModeEnabled } from "@/lib/settings";
import { CompromisedRouteProvider, CompromisedOnly } from "@/components/CompromisedRouteContext";

const displayFont = Space_Grotesk({
  variable: "--font-display-raw",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sansFont = Inter({
  variable: "--font-sans-raw",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono-raw",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const scriptFont = Homemade_Apple({
  variable: "--font-script-raw",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "2026 Dutchie Cybersecurity Awareness Month",
  description: "Earn XP, unlock clearance levels, and climb the ranks all October long.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The real global admin toggle (settings.ts) - still drives the SSR
  // class here exactly as before (no flash-of-normal-theme on first
  // paint when it's actually on). CompromisedRouteProvider layers a
  // second, per-viewer/per-route source on top of it client-side (see
  // CompromisedRouteContext.tsx) without this base value ever changing.
  const compromised = await isCompromisedModeEnabled();
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} ${scriptFont.variable} h-full antialiased ${
        compromised ? "site-compromised" : ""
      }`}
    >
      <body className="grid-glow min-h-full flex flex-col">
        <CompromisedRouteProvider baseCompromised={compromised}>
          <CompromisedOnly>
            <VirusOverlay />
          </CompromisedOnly>
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
          <Footer />
        </CompromisedRouteProvider>
      </body>
    </html>
  );
}
