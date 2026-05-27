import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRoomById } from "@/lib/services/rooms.service";
import { WinnerDisplay } from "@/components/drawing/WinnerDisplay";
import { ParticipantList } from "@/components/participants/ParticipantList";
import { DeleteRoomButton } from "@/components/rooms/DeleteRoomButton";
import { RoomDetailClient } from "@/components/rooms/RoomDetailClient";
import { formatDeadline } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const room = await getRoomById(supabase, id).catch(() => null);

  if (!room) return { title: "Room Not Found — Giveaway App" };

  return {
    title: `${room.title} — Giveaway App`,
    description: room.description,
  };
}

/**
 * Room Detail Page — Server Component.
 *
 * Renders different UI based on room state:
 * - active:   RoomDetailClient (number selection, realtime, countdown)
 * - drawing:  RoomDetailClient (triggers DrawingAnimation)
 * - finished: WinnerDisplay + ParticipantList (static, server-rendered)
 */
export default async function RoomDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [room, authResult] = await Promise.all([
    getRoomById(supabase, id).catch(() => null),
    supabase.auth.getUser(),
  ]);

  if (!room) notFound();

  const currentUserId = authResult.data.user?.id ?? "";
  const isHost = currentUserId === room.host_id;

  // Taken numbers from existing participants
  const takenNumbers = room.participants.map((p) => p.selected_number);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm font-medium flex-wrap">
          <li>
            <Link
              href="/"
              className="underline underline-offset-2"
              style={{ color: "var(--color-primary)" }}
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: "var(--color-muted-foreground)" }}>›</li>
          <li
            className="truncate max-w-[200px]"
            aria-current="page"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {room.title}
          </li>
        </ol>
      </nav>

      {/* Room header */}
      <div className="neo-card p-6 mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* State badge */}
              {room.state === "active" && (
                <span className="neo-badge neo-badge-active">🟢 Active</span>
              )}
              {room.state === "drawing" && (
                <span className="neo-badge neo-badge-drawing">🎰 Drawing!</span>
              )}
              {room.state === "finished" && (
                <span className="neo-badge neo-badge-finished">✅ Finished</span>
              )}
              {isHost && (
                <span className="neo-badge neo-badge-muted text-xs">👑 You're the host</span>
              )}
            </div>

            <h1
              className="text-2xl sm:text-3xl font-black leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {room.title}
            </h1>

            <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              by{" "}
              <strong className="font-bold">{room.host.username}</strong>
            </p>
          </div>

          {/* Host actions */}
          {isHost && room.state === "active" && (
            <DeleteRoomButton roomId={room.id} roomTitle={room.title} />
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed">{room.description}</p>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="neo-badge neo-badge-muted text-xs">
            🔢 {room.min_number}–{room.max_number}
          </span>
          <span className="neo-badge neo-badge-muted text-xs">
            🏆 {room.total_winners} winner{room.total_winners !== 1 ? "s" : ""}
          </span>
          <span className="neo-badge neo-badge-muted text-xs">
            👥 {room.participant_count} participant{room.participant_count !== 1 ? "s" : ""}
          </span>
          <span className="neo-badge neo-badge-muted text-xs">
            📅 {formatDeadline(room.deadline)}
          </span>
        </div>
      </div>

      {/* State-based body */}
      {room.state === "finished" ? (
        /* Finished: static server-rendered winner display */
        <div className="space-y-6">
          <WinnerDisplay
            room={{
              id: room.id,
              title: room.title,
              host: room.host,
              drawingCompletedAt: room.drawing_completed_at,
              drawingParticipantCount: room.drawing_participant_count,
            }}
            winners={room.winners.map((w) => ({
              userId: w.user_id,
              username: w.user.username,
              avatarUrl: w.user.avatar_url,
              selectedNumber: w.selected_number,
              sequence: w.sequence,
            }))}
            currentUserId={currentUserId}
          />

          {/* Full participant list */}
          <section aria-label="All participants">
            <h2
              className="font-black text-base mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              All Participants
            </h2>
            <ParticipantList
              participants={room.participants}
              currentUserId={currentUserId}
            />
          </section>
        </div>
      ) : (
        /* Active / Drawing: interactive Client Component */
        <RoomDetailClient
          room={room}
          currentUserId={currentUserId}
          takenNumbers={takenNumbers}
        />
      )}
    </div>
  );
}
