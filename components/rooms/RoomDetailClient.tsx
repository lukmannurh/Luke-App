"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { NumberSelector } from "@/components/participants/NumberSelector";
import { ParticipantList } from "@/components/participants/ParticipantList";
import { CountdownTimer } from "@/components/drawing/CountdownTimer";
import { ForceDrawButton } from "@/components/drawing/ForceDrawButton";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { useRoomRealtime } from "@/lib/hooks/useRoomRealtime";
import { useMultiTabSync } from "@/lib/hooks/useMultiTabSync";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RoomDetail, RoomState } from "@/lib/types";

// Lazy-load the heavy DrawingAnimation component (SSR disabled)
const DrawingAnimation = dynamic(
  () => import("@/components/drawing/DrawingAnimation").then((m) => m.DrawingAnimation),
  {
    ssr: false,
    loading: () => (
      <div className="neo-card p-8 text-center" aria-busy="true" aria-label="Loading drawing animation…">
        <div className="text-4xl mb-4 animate-pulse" aria-hidden="true">🎰</div>
        <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>Loading drawing…</p>
      </div>
    ),
  }
);

interface RoomDetailClientProps {
  room: RoomDetail;
  currentUserId: string;
  takenNumbers: number[];
}

interface TabSyncMessage {
  type: "state_change" | "participant_count";
  newState?: RoomState;
  count?: number;
}

/**
 * RoomDetailClient — Client Component.
 * Handles:
 * - Join room / number selection
 * - Realtime state transitions (active → drawing → finished)
 * - Multi-tab sync via BroadcastChannel
 * - Drawing animation trigger
 * - Force draw button (host only — available anytime)
 * - Auto-draw on countdown expiry (client-side fallback)
 */
export function RoomDetailClient({
  room,
  currentUserId,
  takenNumbers: initialTakenNumbers,
}: RoomDetailClientProps) {
  const router = useRouter();

  // Strict local view state
  const [currentView, setCurrentView] = useState<RoomState>(room.state);
  
  const [takenNumbers, setTakenNumbers] = useState<number[]>(initialTakenNumbers);
  const [participantCount, setParticipantCount] = useState(room.participant_count);
  const [myNumber, setMyNumber] = useState<number | null>(
    room.participants.find((p) => p.user_id === currentUserId)?.selected_number ?? null
  );
  const [pendingNumber, setPendingNumber] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Guard against double auto-trigger
  const autoDrawTriggeredRef = useRef(false);

  // Multi-tab sync — relay state changes to other open tabs
  const { broadcast } = useMultiTabSync<TabSyncMessage>({
    channel: `room-sync-${room.id}`,
    onMessage: useCallback((msg: TabSyncMessage) => {
      if (msg.type === "state_change" && msg.newState) {
        if (msg.newState === "drawing") {
          setCurrentView("drawing");
        } else if (msg.newState === "finished") {
          setCurrentView((prev) => prev === "drawing" ? "drawing" : "finished");
        } else {
          setCurrentView(msg.newState);
        }
      }
      if (msg.type === "participant_count" && msg.count !== undefined) {
        setParticipantCount(msg.count);
      }
    }, []),
  });

  // Realtime subscriptions
  useRoomRealtime({
    roomId: room.id,
    onStateChange: useCallback(
      (payload: { roomId: string; newState: RoomState; timestamp: string }) => {
        if (payload.newState === "drawing") {
          setCurrentView("drawing");
        } else if (payload.newState === "finished") {
          setCurrentView((prev) => {
            // Do not immediately set to 'finished' if we are currently enjoying the drawing animation
            if (prev === "drawing") return "drawing";
            // Otherwise transition directly to finished and refresh
            router.refresh();
            return "finished";
          });
        } else {
          setCurrentView(payload.newState);
        }
        broadcast({ type: "state_change", newState: payload.newState });
      },
      [broadcast, router]
    ),
    onParticipantCountUpdate: useCallback(
      (payload: { roomId: string; count: number }) => {
        setParticipantCount(payload.count);
        broadcast({ type: "participant_count", count: payload.count });
      },
      [broadcast]
    ),
    onParticipantJoined: useCallback(() => {
      // Refetch participant list to get updated taken numbers
      fetch(`/api/rooms/${room.id}/participants`)
        .then((r) => r.json())
        .then((data) => {
          if (data.takenNumbers) setTakenNumbers(data.takenNumbers);
          if (typeof data.taken === "number") setParticipantCount(data.taken);
        })
        .catch(() => {}); // Non-fatal
    }, [room.id]),
    onDrawingStart: useCallback(() => {
      setCurrentView("drawing");
    }, []),
    onDrawingComplete: useCallback(() => {
      setCurrentView((prev) => {
        if (prev === "drawing") return "drawing"; // Animation will finish it
        router.refresh();
        return "finished";
      });
    }, [router]),
  });

  // ── Auto-draw when countdown expires ──────────────────────────
  const handleCountdownExpire = useCallback(async () => {
    // Only the host triggers auto-draw (to avoid N clients all calling)
    if (currentUserId !== room.host_id) return;
    if (autoDrawTriggeredRef.current) return;
    autoDrawTriggeredRef.current = true;

    try {
      const res = await fetch(`/api/rooms/${room.id}/force-draw`, {
        method: "POST",
      });
      if (res.ok) {
        toast.info("⏰ Deadline reached — drawing started automatically!");
        setCurrentView("drawing");
      }
    } catch {
      // Cron job or another tab may handle it — non-fatal
      autoDrawTriggeredRef.current = false;
    }
  }, [room.id, room.host_id, currentUserId]);

  // ── Join room handler ──────────────────────────────────────────
  async function handleNumberSelect(selectedNumber: number) {
    if (isJoining || myNumber !== null) return;
    setIsJoining(true);

    try {
      const res = await fetch(`/api/rooms/${room.id}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Number just got taken — remove it from available
          setTakenNumbers((prev) => [...prev, selectedNumber]);
          toast.error(data.error?.message ?? "That number was just taken. Choose another!");
        } else {
          toast.error(data.error?.message ?? "Failed to join room.");
        }
      } else {
        // 1. Optimistic local state update
        setMyNumber(selectedNumber);
        setTakenNumbers((prev) => [...prev, selectedNumber]);
        setParticipantCount((prev) => prev + 1);
        toast.success(`🎉 You picked number ${selectedNumber}! Good luck!`);

        // 2. Refresh Server Components (ParticipantList will update)
        router.refresh();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsJoining(false);
    }
  }

  // ── Render by state ────────────────────────────────────────────

  if (currentView === "finished") {
    return (
      <div className="space-y-4">
        <div className="neo-badge neo-badge-finished inline-flex">✅ Drawing Complete</div>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Refreshing results…
        </p>
      </div>
    );
  }

  if (currentView === "drawing") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="neo-badge neo-badge-drawing">🎰 Drawing in progress!</span>
          <ConnectionStatus roomId={room.id} />
        </div>
        <DrawingAnimation
          roomId={room.id}
          totalWinners={room.total_winners}
          participantCount={participantCount}
          onComplete={() => {
            setCurrentView("finished");
            router.refresh();
          }}
        />
      </div>
    );
  }

  // Active state
  return (
    <div className="space-y-6">
      {/* Connection + participants header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span
          className="text-sm font-bold"
          style={{ color: "var(--color-muted-foreground)" }}
          aria-live="polite"
        >
          👥 {participantCount} participant{participantCount !== 1 ? "s" : ""} joined
        </span>
        <ConnectionStatus roomId={room.id} />
      </div>

      {/* Countdown */}
      <div
        className="neo-card p-4 flex items-center gap-3"
        style={{ background: "var(--color-muted)" }}
      >
        <span className="text-sm font-bold">⏰ Closes in:</span>
        <CountdownTimer
          deadline={room.deadline}
          variant="full"
          onExpire={handleCountdownExpire}
        />
      </div>

      {/* Host: Draw Now button — always visible for host */}
      <ForceDrawButton room={room} currentUserId={currentUserId} />

      {/* Number selection */}
      {myNumber !== null ? (
        /* Already joined */
        <div
          className="neo-card p-5 text-center text-zinc-900 dark:text-zinc-900"
          style={{ background: "#eff6ff", boxShadow: "var(--shadow-neo-primary)" }}
        >
          <div className="text-4xl font-black mb-1" style={{ fontFamily: "var(--font-display)" }}>
            {myNumber}
          </div>
          <p className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>
            ✅ Your lucky number is locked in!
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            The drawing will happen after the deadline or when the host triggers it.
          </p>
        </div>
      ) : (
        /* Not yet joined */
        <div className="neo-card p-5">
          <h2
            className="font-black text-lg mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pick Your Lucky Number
          </h2>
          <div className={isJoining ? "opacity-50 pointer-events-none" : ""}>
            <NumberSelector
              roomId={room.id}
              minNumber={room.min_number}
              maxNumber={room.max_number}
              takenNumbers={takenNumbers}
              selectedNumber={myNumber}
              onSelect={setPendingNumber}
            />
          </div>
          {isJoining && (
            <div className="flex items-center gap-2 mt-3" aria-live="polite">
              <span
                className="inline-block w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span className="text-sm font-medium">Locking in your number…</span>
            </div>
          )}

          {/* Confirmation Dialog */}
          <AlertDialog open={pendingNumber !== null} onOpenChange={(open) => !open && setPendingNumber(null)}>
            <AlertDialogContent className="neo-card p-6 rounded-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display font-black text-xl">
                  Konfirmasi Nomor
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  Kunci nomor {pendingNumber}? Pilihan ini tidak dapat diubah.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 gap-3">
                <AlertDialogCancel className="neo-btn neo-btn-outline w-full sm:w-auto m-0">
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    if (pendingNumber !== null) {
                      handleNumberSelect(pendingNumber);
                      setPendingNumber(null);
                    }
                  }}
                  className="neo-btn neo-btn-primary w-full sm:w-auto m-0"
                >
                  Kunci Nomor
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Participant list */}
      <section aria-label="Participants">
        <h2
          className="font-black text-base mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Participants
        </h2>
        <ParticipantList
          participants={room.participants}
          currentUserId={currentUserId}
          maxVisible={20}
        />
      </section>
    </div>
  );
}
