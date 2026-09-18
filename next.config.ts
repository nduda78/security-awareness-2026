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
  // admin form's unlock-audio/image/video uploads (video up to 20MB, audio
  // up to 15MB, images up to 4MB — see lib/assetUpload.ts). Sized to fit all
  // three at once since they're all fields on the same form submission.
  //
  // proxyClientMaxBodySize is a separate, unrelated limit: Next buffers the
  // request body in memory wherever it passes through proxy.ts (which runs
  // on every non-static route, including this app's dedicated asset-upload
  // API route — see api/admin/challenge-asset/route.ts), and silently caps
  // that buffer at 10MB by default with NO error surfaced to the request —
  // req.formData() in the route handler just throws "Failed to parse body
  // as FormData" once the truncated body no longer parses, which is what a
  // >10MB upload to that route hits regardless of the 20MB/15MB checks in
  // assetUpload.ts ever being reached. Sized to the largest asset (video,
  // 20MB) plus headroom for multipart overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "85mb",
    },
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
