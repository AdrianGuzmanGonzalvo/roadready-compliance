import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build for the Docker image (see Dockerfile).
  output: "standalone",
  experimental: {
    // Document uploads go through the proxy, which buffers request bodies and
    // silently cuts them at this size. Keep it just above MAX_DOCUMENT_BYTES
    // (src/lib/document-storage.ts).
    proxyClientMaxBodySize: "26mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No other site may show these pages inside a frame (clickjacking). Same-origin frames keep working.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          // Every hostname is served over HTTPS by Cloudflare; subdomains left out on purpose.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
};

export default nextConfig;
