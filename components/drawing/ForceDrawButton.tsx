"use client";

import { useState } from "react";

interface ForceDrawButtonProps {
  room: {
    id: string;
    deadline: string;
    state: string;
    host_id: string;
  };
  currentUserId: string;
}

/**
 * ForceDrawButton — Client Component.
 * Renders a "Draw Now" button for the Room_Host at ALL TIMES while room is active.
 * No grace period required — host can trigger the draw immediately.
 * Calls the force-draw API endpoint.
 */
export function ForceDrawButton({ room, currentUserId }: ForceDrawButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isHost = currentUserId === room.host_id;
  const isActive = room.state === "active";

  // Only render for host while room is active
  if (!isHost || !isActive) return null;

  async function handleForceDraw() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${room.id}/force-draw`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Force draw failed. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="neo-card p-4 text-center text-zinc-900 dark:text-zinc-900"
        style={{ background: "#f0fdf4", boxShadow: "var(--shadow-neo-success)" }}
      >
        <p className="font-bold" style={{ color: "var(--color-success)" }}>
          ✅ Drawing started! Refreshing…
        </p>
      </div>
    );
  }

  return (
    <div
      className="neo-card p-4 text-zinc-900 dark:text-zinc-900"
      style={{
        background: "#fef3c7",
        boxShadow: "var(--shadow-neo-warning)",
        borderColor: "var(--color-warning)",
      }}
    >
      <p className="font-bold text-sm mb-3" style={{ fontFamily: "var(--font-display)" }}>
        🎰 Ready to draw? You can start the drawing at any time.
      </p>

      {error && (
        <p className="text-sm font-medium mb-2" style={{ color: "var(--color-destructive)" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        id="force-draw-btn"
        onClick={handleForceDraw}
        disabled={isLoading}
        className="neo-btn neo-btn-warning neo-btn-full"
        aria-label="Manually trigger the drawing now"
      >
        {isLoading ? (
          <>
            <span
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Starting drawing…
          </>
        ) : (
          "🎰 Draw Now"
        )}
      </button>
    </div>
  );
}
