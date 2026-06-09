import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  exclude: [/\/release\/.*/, /\.apk$/],
});

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
      {
        protocol: "https",
        hostname: "*.supabase.co", // Supabase Storage
      },
    ],
    // Optimize to WebP/AVIF for mobile performance
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 1 week
    minimumCacheTTL: 604800,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
