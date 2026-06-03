import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trophy, Clock, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRoomById } from "@/lib/services/rooms.service";
import { WinnerDisplay } from "@/components/drawing/WinnerDisplay";
import { ParticipantList } from "@/components/participants/ParticipantList";
import { DeleteRoomButton } from "@/components/rooms/DeleteRoomButton";
import { RoomDetailClient } from "@/components/rooms/RoomDetailClient";
import { StateBadge } from "@/components/rooms/RoomCard";
import { formatDeadline } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const room = await getRoomById(supabase, id).catch(() => null);
  if (!room) return { title: "Room Not Found — DrawUp" };
  return {
    title: `${room.title} — DrawUp`,
    description: room.description,
  };
}

/**
 * Room Detail Page — Lovable UI + existing backend logic preserved.
 * - active/drawing: RoomDetailClient (number picker, realtime, countdown)
 * - finished: WinnerDisplay + ParticipantList (static server-rendered)
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
  const takenNumbers = room.participants.map((p) => p.selected_number);

  // Accent colour from room id
  const accentOptions = [
    "bg-lime text-lime-foreground",
    "bg-pink text-pink-foreground",
    "bg-sky text-sky-foreground",
    "bg-coin text-coin-foreground",
  ];
  const accentClass = accentOptions[room.id.charCodeAt(0) % accentOptions.length];

  return (
    <>
      {/* Back link */}
      <Link
        href="/rooms"
        className="inline-flex items-center gap-1 font-display text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Browse
      </Link>

      {/* Room info card */}
      <div className="brutal mt-3 rounded-2xl bg-card p-5 text-card-foreground">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`brutal flex h-12 w-12 items-center justify-center rounded-xl font-display text-xl ${accentClass}`}
          >
            🎁
          </span>
          <div className="flex items-center gap-2">
            <StateBadge state={room.state} />
            {isHost && (
              <span className="brutal-press-sm inline-flex items-center gap-1 rounded-full bg-coin px-2.5 py-0.5 text-xs font-bold text-coin-foreground">
                👑 Host
              </span>
            )}
          </div>
        </div>

        <h1 className="mt-3 font-display text-2xl leading-tight tracking-tight">{room.title}</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">by {room.host.username}</p>
        <p className="mt-3 text-sm leading-relaxed">{room.description}</p>

        {/* Meta badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="brutal flex items-center gap-1 rounded-lg bg-coin px-2.5 py-1 font-display text-sm text-coin-foreground">
            🪙 10 credits
          </span>
          <MetaBadge icon={<Users className="h-4 w-4" strokeWidth={2.5} />} text={`${room.participant_count}`} />
          <MetaBadge
            icon={<Trophy className="h-4 w-4" strokeWidth={2.5} />}
            text={`${room.total_winners} winner${room.total_winners !== 1 ? "s" : ""}`}
          />
          <MetaBadge
            icon={<Clock className="h-4 w-4" strokeWidth={2.5} />}
            text={formatDeadline(room.deadline)}
          />
        </div>

        {/* Host delete action */}
        {isHost && room.state === "active" && (
          <div className="mt-4">
            <DeleteRoomButton roomId={room.id} roomTitle={room.title} />
          </div>
        )}
      </div>

      {/* State-based body */}
      {room.state === "finished" ? (
        <>
          {/* Winners */}
          <section className="mt-5">
            <h2 className="font-display text-lg">🏆 Winners</h2>
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
          </section>

          {/* All participants */}
          <section className="mt-6">
            <h2 className="font-display text-lg">Participants</h2>
            <div className="mt-3">
              <ParticipantList
                participants={room.participants}
                currentUserId={currentUserId}
              />
            </div>
          </section>
        </>
      ) : (
        /* Active / Drawing: interactive Client Component (number picker, countdown, realtime) */
        <RoomDetailClient
          room={room}
          currentUserId={currentUserId}
          takenNumbers={takenNumbers}
        />
      )}
    </>
  );
}

function MetaBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="brutal-press-sm flex items-center gap-1 rounded-lg bg-card px-2.5 py-1 text-xs font-bold text-card-foreground">
      {icon}
      {text}
    </span>
  );
}
