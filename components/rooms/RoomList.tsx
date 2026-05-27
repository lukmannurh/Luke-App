"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RoomCard } from "@/components/rooms/RoomCard";
import type { RoomListItem, RoomsListResponse, RoomState } from "@/lib/types";

const FILTER_TABS: { label: string; value: RoomState | "all" }[] = [
  { label: "All", value: "all" },
  { label: "🟢 Active", value: "active" },
  { label: "🎰 Drawing", value: "drawing" },
  { label: "✅ Finished", value: "finished" },
];

interface RoomListProps {
  /** Initial rooms data from server (SSR) */
  initialData: RoomsListResponse;
}

/**
 * RoomList — Client Component.
 * Filters rooms by state, paginates, and subscribes to realtime state changes.
 */
export function RoomList({ initialData }: RoomListProps) {
  const [filter, setFilter] = useState<RoomState | "all">("all");
  const [page, setPage] = useState(1);
  const [rooms, setRooms] = useState<RoomListItem[]>(initialData.rooms);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch rooms when filter or page changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filter !== "all") params.set("state", filter);
    params.set("page", String(page));
    params.set("limit", "12");

    fetch(`/api/rooms?${params}`)
      .then((r) => r.json())
      .then((data: any) => {
        if (!cancelled) {
          if (data.error || !data.rooms) {
            throw new Error(data.error?.message || "Invalid API response");
          }
          setRooms(data.rooms);
          setPagination(data.pagination);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load rooms. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  // Realtime: listen for room state changes and update the list
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("rooms-list-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: "state=neq.active" },
        (payload) => {
          setRooms((prev) =>
            prev.map((r) =>
              r.id === payload.new.id ? { ...r, state: payload.new.state as RoomState } : r
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rooms" },
        () => {
          // Refetch page 1 to show new room
          if (page === 1 && (filter === "all" || filter === "active")) {
            setPage((p) => p); // trigger effect re-run by changing a dep
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, page]);

  function handleFilterChange(value: RoomState | "all") {
    setFilter(value);
    setPage(1);
  }

  return (
    <section aria-label="Rooms list">
      {/* Filter tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-6"
        role="tablist"
        aria-label="Filter rooms by state"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            id={`filter-tab-${tab.value}`}
            role="tab"
            aria-selected={filter === tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`neo-btn neo-btn-sm flex-shrink-0 ${
              filter === tab.value
                ? "neo-btn-accent"
                : "neo-btn-outline"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <div
          className="neo-card p-6 text-center"
          style={{ borderColor: "var(--color-destructive)" }}
          role="alert"
        >
          <p className="font-bold" style={{ color: "var(--color-destructive)" }}>
            {error}
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="neo-card p-5 animate-pulse"
              style={{ minHeight: "160px", background: "var(--color-muted)" }}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">
            🎪
          </div>
          <h3
            className="text-xl font-black mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            No rooms yet
          </h3>
          <p style={{ color: "var(--color-muted-foreground)" }}>
            {filter === "active"
              ? "No active rooms right now. Create one!"
              : filter === "drawing"
              ? "No rooms are drawing right now."
              : filter === "finished"
              ? "No finished rooms yet."
              : "Be the first to create a giveaway room!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && !isLoading && (
        <div
          className="flex items-center justify-center gap-2 mt-6"
          aria-label="Pagination"
        >
          <button
            id="pagination-prev"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="neo-btn neo-btn-outline neo-btn-sm"
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <span
            className="neo-badge neo-badge-muted"
            aria-label={`Page ${pagination.page} of ${pagination.totalPages}`}
          >
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            id="pagination-next"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNextPage}
            className="neo-btn neo-btn-outline neo-btn-sm"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
