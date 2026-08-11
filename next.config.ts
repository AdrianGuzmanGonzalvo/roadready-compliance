import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the synthetic demo database into every serverless function so it's
  // available to copy into /tmp on cold start (see src/lib/prisma.ts).
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/seed.db"],
    "/**/*": ["./prisma/seed.db"],
  },
};

export default nextConfig;
