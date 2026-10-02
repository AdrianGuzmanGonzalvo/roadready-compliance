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
};

export default nextConfig;
