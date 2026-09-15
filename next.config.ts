import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // This app is viewed through the VAPE dashboard's public preview URL
  // (e.g. preview-3001--<instance>.stable.dexus.io), not localhost. Next's
  // dev server otherwise blocks cross-origin dev asset/HMR requests by
  // default, which silently breaks client-side hydration (including the
  // photo crop tool) when loaded from that origin instead of localhost.
  allowedDevOrigins: ["*.stable.dexus.io", "*.dev.dexus.io", "*.dexus.io"],

  // Default server-action body limit (1MB) is too small for the challenge
  // admin form's unlock-audio/image uploads (audio up to 15MB, images up to
  // 4MB — see actions/admin.ts).
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
