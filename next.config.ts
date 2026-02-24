import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  turbopack: {
    root: path.resolve('.'),
  },
};

export default nextConfig;
