import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverActions: {
    bodySizeLimit: '15mb',
  },
};

export default nextConfig;
