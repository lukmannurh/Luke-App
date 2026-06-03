import Link from "next/link";
import { Users, Trophy, Clock } from "lucide-react";
import type { RoomListItem } from "@/lib/types";
import { formatDeadline } from "@/lib/utils/date";

// Accent colour palette — matches Lovable's accentBg map
const ACCENT_COLORS: Record<string, string> = {
  lime: "bg-lime text-lime-foreground",
  pink: "bg-pink text-pink-foreground",
  sky: "bg-sky text-sky-foreground",
  coin: "bg-coin text-coin-foreground",
};

/**
 * Derives a deterministic accent colour from the room ID.
 */
function getAccent(id: string): string {
  const keys = Object.keys(ACCENT_COLORS);
  const idx = id.charCodeAt(0) % keys.length;
  return ACCENT_COLORS[keys[idx]] ?? ACCENT_COLORS.lime;
}

export function StateBadge({ state }: { state: string }) {
  if (state === "active")
    return (
      <span className="brutal-press-sm inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-xs font-bold text-lime-foreground">
        🟢 Active
      </span>
    );
  if (state === "drawing")
    return (
      <span className="brutal-press-sm inline-flex items-center gap-1 rounded-full bg-pink px-2.5 py-0.5 text-xs font-bold text-pink-foreground">
        🎰 Drawing
      </span>
    );
  return (
    <span className="brutal-press-sm inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 text-xs font-bold text-card-foreground">
      ✅ Finished
    </span>
  );
}

export function RoomCard({ room, index = 0 }: { room: RoomListItem; index?: number }) {
  const accentClass = getAccent(room.id);

  return (
    <Link
      href={`/rooms/${room.id}`}
      id={`room-card-${room.id}`}
      style={{ animationDelay: `${index * 60}ms` }}
      className="brutal-press animate-rise block rounded-2xl bg-card p-4 text-card-foreground"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`brutal flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl font-display text-xl ${accentClass}`}
        >
          🎁
        </span>
        <StateBadge state={room.state} />
      </div>

      <h3 className="mt-3 font-display text-lg leading-tight tracking-tight">{room.title}</h3>
      <p className="mt-1 text-sm font-medium text-muted-foreground">by {room.host.username}</p>

      <div className="mt-3 flex items-center gap-2">
        <span className="brutal flex items-center gap-1 rounded-lg bg-coin px-2.5 py-1 font-display text-sm text-coin-foreground">
          🔢 #{room.min_number}–{room.max_number}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" strokeWidth={2.5} /> {room.participant_count}
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-4 w-4" strokeWidth={2.5} /> {room.total_winners} winner{room.total_winners !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" strokeWidth={2.5} /> {formatDeadline(room.deadline)}
        </span>
      </div>
    </Link>
  );
}
