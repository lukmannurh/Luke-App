import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRooms } from "@/lib/services/rooms.service";
import { RoomList } from "@/components/rooms/RoomList";

export const metadata: Metadata = {
  title: "Browse Rooms — Giveaway App",
  description:
    "Browse active giveaway rooms, join one and select your lucky number before the deadline.",
};

/**
 * Home page — Server Component.
 * Fetches the first page of active rooms server-side for fast initial render,
 * then hands control to RoomList (Client) for filtering, pagination, and realtime.
 */
export default async function HomePage() {
  const supabase = await createClient();

  // Fetch auth user (for personalised CTA)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // SSR initial data: first 12 rooms (all states, newest first)
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

  return (
    <div>
      {/* Hero section */}
      <section
        className="neo-card p-6 mb-8"
        style={{ background: "var(--color-accent)" }}
        aria-labelledby="hero-title"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1
              id="hero-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              🎁 Community Giveaways
            </h1>
            <p className="mt-1 text-sm sm:text-base font-medium" style={{ color: "var(--color-accent-foreground)" }}>
              Pick your lucky number. Win prizes. Fair draws every time.
            </p>
          </div>
          {user && (
            <Link
              href="/rooms/create"
              id="hero-create-room-btn"
              className="neo-btn neo-btn-primary flex-shrink-0"
              aria-label="Create a new giveaway room"
            >
              ➕ Create Room
            </Link>
          )}
        </div>
      </section>

      {/* Room list with filter tabs, pagination, realtime updates */}
      <RoomList initialData={initialData} />
    </div>
  );
}

