import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not Found — Giveaway App",
};

/**
 * Global 404 page — shown when a route or resource is not found.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="neo-card p-10 text-center max-w-md w-full">
        <div className="text-7xl font-black mb-4" style={{ fontFamily: "var(--font-display)" }}>
          404
        </div>
        <div className="text-4xl mb-4" aria-hidden="true">🎪</div>
        <h1
          className="text-2xl font-black mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Room Not Found
        </h1>
        <p className="mb-6" style={{ color: "var(--color-muted-foreground)" }}>
          This page doesn't exist, or the giveaway room was deleted.
        </p>
        <Link href="/" id="not-found-home-btn" className="neo-btn neo-btn-primary">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
