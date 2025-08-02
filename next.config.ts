import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 💥 Disable eslint saat build Vercel
  },
};

export default nextConfig;
