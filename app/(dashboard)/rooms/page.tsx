import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getRooms } from "@/lib/services/rooms.service";
import { resolveExpiredRooms } from "@/lib/services/drawing.service";
import { RoomList } from "@/components/rooms/RoomList";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Browse Rooms — DrawUp",
  description:
    "Browse active community giveaway rooms, join one and pick your lucky number before the deadline.",
};

export const dynamic = "force-dynamic";

async function RoomsWrapper() {
  const supabaseAdmin = createAdminClient();
  // Lazy Evaluation: resolve any expired rooms before rendering
  await resolveExpiredRooms(supabaseAdmin);

  const supabase = await createClient();
  const { rooms } = await getRooms(supabase);

  return <RoomList rooms={rooms} />;
}

export default function RoomsPage() {
  return (
    <>
      {/* Hero banner */}
      <section className="brutal rounded-2xl bg-accent p-5 text-accent-foreground">
        <span className="brutal inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-foreground">
          Community Giveaways
        </span>
        <h1 className="mt-3 font-display text-2xl leading-tight tracking-tight">
          Pick your lucky number. Win prizes.
        </h1>
        <p className="mt-1 text-sm font-medium">Fair draws, every single time.</p>
        <Link
          href="/rooms/create"
          id="rooms-create-btn"
          className="brutal-press mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-4 font-display text-primary-foreground"
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
          Create Room
        </Link>
      </section>

      {/* Room list with Suspense */}
      <div className="mt-5">
        <Suspense
          fallback={
            <div className="mt-4 flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="brutal animate-pulse rounded-2xl bg-card p-4 text-card-foreground"
                  style={{ height: 140 }}
                />
              ))}
            </div>
          }
        >
          <RoomsWrapper />
        </Suspense>
      </div>
    </>
  );
}
