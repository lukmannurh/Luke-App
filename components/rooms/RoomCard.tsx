import Link from "next/link";
import { Users, Trophy, Clock } from "lucide-react";
import { CountdownTimer } from "@/components/drawing/CountdownTimer";
import { LocalTime } from "@/components/shared/LocalTime";
import type { RoomListItem } from "@/lib/types";

interface RoomCardProps {
  room: RoomListItem;
}

function StateBadge({ state }: { state: string }) {
  if (state === "active")
    return (
      <span
        className="brutal-press-sm inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
        style={{ background: "var(--color-lime)", color: "var(--color-lime-foreground)" }}
      >
        🟢 Active
      </span>
    );
  if (state === "drawing")
    return (
      <span
        className="brutal-press-sm inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
        style={{ background: "var(--color-pink)", color: "var(--color-pink-foreground)" }}
      >
        🎰 Drawing
      </span>
    );
  return (
    <span
      className="brutal-press-sm inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{ background: "white", color: "var(--color-foreground)", border: "2px solid var(--color-border)" }}
    >
      ✅ Finished
    </span>
  );
}

/**
 * RoomCard — Server Component.
 * Neobrutalist redesign matching Lovable reference design.
 */
export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      id={`room-card-${room.id}`}
      className="brutal-press block rounded-2xl p-4 focus-visible:outline-4"
      style={{ background: "white", color: "var(--color-foreground)" }}
      aria-label={`View room: ${room.title}`}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="brutal flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
        >
          🎁
        </span>
        <StateBadge state={room.state} />
      </div>

      {/* Title + host */}
      <h3
        className="mt-3 text-lg leading-tight tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {room.title}
      </h3>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>
        by {room.host.username}
      </p>

      {/* Prize badge + range */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className="brutal flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold"
          style={{
            background: "var(--color-coin)",
            color: "var(--color-coin-foreground)",
            fontFamily: "var(--font-display)",
          }}
        >
          🪙 {room.min_number}–{room.max_number}
        </span>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold" style={{ color: "var(--color-muted-foreground)" }}>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" strokeWidth={2.5} /> {room.participant_count}
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-4 w-4" strokeWidth={2.5} /> {room.total_winners} winner{room.total_winners !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" strokeWidth={2.5} />
          {room.state === "active" ? (
            <CountdownTimer deadline={room.deadline} variant="compact" />
          ) : (
            <LocalTime iso={room.deadline} format="deadline" />
          )}
        </span>
      </div>
    </Link>
  );
}
