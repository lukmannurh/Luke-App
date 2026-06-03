import type { Metadata } from "next";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getRooms } from "@/lib/services/rooms.service";
import { resolveExpiredRooms } from "@/lib/services/drawing.service";
import { RoomList } from "@/components/rooms/RoomList";
import { Hero } from "@/components/landing/Hero";
import { BentoFeatures } from "@/components/landing/BentoFeatures";

export const metadata: Metadata = {
  title: "DrawUp — Fair Draws. Zero Friction.",
  description:
    "DrawUp is a mobile-first community giveaway app. Run transparent coin draws with smart credits, zero-wait automatic draws, and frictionless guest entry.",
};

// All data fetches use Supabase cookies — must be dynamic (no static prerendering)
export const dynamic = "force-dynamic";


function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-background)" }}>
      {/* Hero section */}
      <main className="flex-1">
        <Hero isLoggedIn={false} />
        <BentoFeatures />
      </main>

      {/* Sticky CTA bar */}
      <div
        className="sticky bottom-0 z-40 px-4 py-3"
        style={{ borderTop: "3px solid var(--color-border)", background: "var(--color-background)" }}
      >
        <div className="mx-auto max-w-md">
          <Link
            href="/rooms/create"
            id="landing-cta-btn"
            className="brutal-press flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg"
            aria-label="Create a new giveaway"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              fontFamily: "var(--font-display)",
            }}
          >
            <Rocket className="h-6 w-6" strokeWidth={2.5} />
            Create Your Giveaway Now
          </Link>
        </div>
      </div>
    </div>
  );
}

async function RoomsWrapper() {
  const supabase = await createClient();

  // ⚡ Lazy Evaluation: Sweep & draw expired rooms before rendering
  // This is the cron-fallback for Vercel Hobby Tier limitations.
  const supabaseAdmin = createAdminClient();
  await resolveExpiredRooms(supabaseAdmin);

  const initialData = await getRooms(supabase, { page: 1, limit: 12 }).catch(
    () => ({
      rooms: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    })
  );

  return <RoomList initialData={initialData} />;
}

/**
 * Home page — Server Component.
 *
 * Architecture:
 * - Guests see the marketing Landing Page (Hero + BentoFeatures + Sticky CTA).
 * - Logged-in users see the room browser (existing RoomList with Lazy Evaluation draw).
 *
 * The Lazy Evaluation logic (resolveExpiredRooms) is always called during SSR
 * so expired rooms get resolved on every visit regardless of cron availability.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Show landing page to unauthenticated visitors
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated users see the giveaway room browser
  return (
    <div>
      {/* Hero section for authenticated users */}
      <section
        className="mb-8 p-6"
        style={{
          background: "var(--color-primary)",
          border: "3px solid var(--color-border)",
          boxShadow: "var(--shadow-neo-lg)",
        }}
        aria-labelledby="hero-title"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1
              id="hero-title"
              className="text-2xl sm:text-3xl lg:text-4xl leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              🎁 Community Giveaways
            </h1>
            <p className="mt-1 text-sm sm:text-base font-medium" style={{ color: "var(--color-primary-foreground)" }}>
              Pick your lucky number. Win prizes. Fair draws every time.
            </p>
          </div>
          <Link
            href="/rooms/create"
            id="hero-create-room-btn"
            className="brutal-press flex-shrink-0 flex items-center gap-2 rounded-xl px-6 py-3 text-base font-bold"
            style={{
              background: "white",
              color: "var(--color-foreground)",
              fontFamily: "var(--font-display)",
            }}
            aria-label="Create a new giveaway room"
          >
            ➕ Create Room
          </Link>
        </div>
      </section>

      {/* Room list with filter tabs, pagination, realtime updates */}
      <Suspense fallback={<p>Loading...</p>}>
        <RoomsWrapper />
      </Suspense>
    </div>
  );
}
