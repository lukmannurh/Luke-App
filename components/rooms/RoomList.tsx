"use client";

import { useState } from "react";
import { RoomCard } from "@/components/rooms/RoomCard";
import type { RoomListItem } from "@/lib/types";

const FILTERS: { key: "all" | "active" | "drawing" | "finished"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "drawing", label: "Drawing" },
  { key: "finished", label: "Finished" },
];

export function RoomList({ rooms }: { rooms: RoomListItem[] }) {
  const [filter, setFilter] = useState<"all" | "active" | "drawing" | "finished">("all");
  const filtered = filter === "all" ? rooms : rooms.filter((r) => r.state === filter);

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`brutal-press-sm flex-shrink-0 rounded-xl px-4 py-2 font-display text-sm ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Room cards */}
      <div className="mt-4 flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="brutal flex flex-col items-center justify-center text-center rounded-2xl bg-card p-10 text-card-foreground">
            <div className="text-4xl">💭</div>
            <p className="mt-3 font-display text-lg">No rooms here yet</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Try another filter or create your own.
            </p>
          </div>
        ) : (
          filtered.map((room, i) => <RoomCard key={room.id} room={room} index={i} />)
        )}
      </div>
    </>
  );
}
