import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LocalTime } from "@/components/shared/LocalTime";
import { DeleteRoomButton } from "@/components/rooms/DeleteRoomButton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Drawing History — DrawUp",
  description: "Browse completed giveaway rooms and see the winners.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function HistoryContent({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  const { data: rooms, count } = await supabase
    .from("rooms")
    .select(
      `id, title, description, deadline, drawing_completed_at,
       drawing_participant_count, total_winners, host_id,
       host:users!rooms_host_id_fkey(id, username, avatar_url),
       winners(sequence, selected_number, user:users!winners_user_id_fkey(username, avatar_url))`,
      { count: "exact" }
    )
    .eq("state", "finished")
    .order("drawing_completed_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const finished = rooms ?? [];

  return (
    <>
      <h1 className="font-display text-3xl leading-tight tracking-tight">📜 Drawing History</h1>
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        {count ?? 0} completed giveaway{(count ?? 0) !== 1 ? "s" : ""}
      </p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        History is automatically cleared after 7 days.
      </p>

      {finished.length === 0 ? (
        <div className="brutal mt-5 rounded-2xl bg-card p-10 text-center text-card-foreground">
          <div className="text-4xl">💭</div>
          <p className="mt-3 font-display text-lg">No finished giveaways yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back after the first deadline passes.</p>
          <Link href="/rooms" className="brutal-press mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-4 font-display text-primary-foreground">
            Browse Active Rooms
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {(finished as any[]).map((room, i) => {
            const top = room.winners
              ?.sort((a: any, b: any) => a.sequence - b.sequence)
              ?.at(0);
            return (
              <div key={room.id} className="relative">
                <Link
                  href={`/rooms/${room.id}`}
                  id={`history-room-${room.id}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="brutal-press animate-rise flex items-start gap-3 rounded-2xl bg-card p-4 text-card-foreground"
                  aria-label={`View results for ${room.title}`}
                >
                  <span className="brutal flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-coin text-xl text-coin-foreground">
                    {top ? "🏆" : "🎤"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate font-display text-lg leading-tight">{room.title}</h2>
                      <span className="brutal-press-sm flex-shrink-0 rounded-full bg-card px-2.5 py-0.5 text-xs font-bold">✅</span>
                    </div>
                    {top ? (
                      <p className="mt-1 text-sm font-medium">
                        🥇 {top.user?.username}{" "}
                        <span className="text-muted-foreground">(#{top.selected_number})</span>
                        {room.winners.length > 1 && (
                          <span className="text-muted-foreground"> + {room.winners.length - 1} more</span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">No participants</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-3 text-xs font-bold text-muted-foreground">
                      <span>by {(room.host as any)?.username}</span>
                      <span>👥 {room.drawing_participant_count ?? 0}</span>
                      <span>
                        {room.drawing_completed_at
                          ? <LocalTime iso={room.drawing_completed_at} format="timestamp" />
                          : <LocalTime iso={room.deadline} format="deadline" />}
                      </span>
                    </div>
                  </div>
                </Link>
                {currentUserId && currentUserId === room.host_id && (
                  <div className="absolute right-3 top-3">
                    <DeleteRoomButton
                      roomId={room.id}
                      roomTitle={room.title}
                      isFinished={true}
                      hostId={room.host_id}
                      currentUserId={currentUserId}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="History pagination">
          {page > 1 && (
            <Link href={`/rooms/history?page=${page - 1}`} id="history-prev" className="brutal-press-sm rounded-xl bg-card px-4 py-2 font-display text-card-foreground" aria-label="Previous page">
              ← Prev
            </Link>
          )}
          <span className="brutal-press-sm rounded-full bg-card px-3 py-0.5 font-display text-xs text-card-foreground">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/rooms/history?page=${page + 1}`} id="history-next" className="brutal-press-sm rounded-xl bg-card px-4 py-2 font-display text-card-foreground" aria-label="Next page">
              Next →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

export default function HistoryPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <>
          <h1 className="font-display text-3xl leading-tight tracking-tight">📜 Drawing History</h1>
          <p className="mt-1 text-sm font-medium animate-pulse text-muted-foreground">Loading history...</p>
        </>
      }
    >
      <HistoryContent searchParams={props.searchParams} />
    </Suspense>
  );
}
