import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // This app is viewed through the VAPE dashboard's public preview URL
  // (e.g. preview-3001--<instance>.stable.dexus.io), not localhost. Next's
  // dev server otherwise blocks cross-origin dev asset/HMR requests by
  // default, which silently breaks client-side hydration (including the
  // photo crop tool) when loaded from that origin instead of localhost.
  allowedDevOrigins: ["*.stable.dexus.io", "*.dev.dexus.io", "*.dexus.io"],
};

export default nextConfig;
