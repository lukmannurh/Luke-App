import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth avatars (primary)
      },
      {
        protocol: "https",
        hostname: "lh1.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh2.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
    ],
    // Optimize to WebP/AVIF for mobile performance
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 1 week
    minimumCacheTTL: 604800,
  },
};

export default nextConfig;

