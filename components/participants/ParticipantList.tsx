import Image from "next/image";
import type { ParticipantWithUser } from "@/lib/types";

interface ParticipantListProps {
  participants: ParticipantWithUser[];
  currentUserId?: string;
  /** Optional max to show before collapsing — defaults to showing all */
  maxVisible?: number;
}

/**
 * ParticipantList — Server Component.
 * Renders the list of participants with avatar, username, and selected number.
 * Highlights the current user if they're in the list.
 */
export function ParticipantList({
  participants,
  currentUserId,
  maxVisible,
}: ParticipantListProps) {
  const visible = maxVisible ? participants.slice(0, maxVisible) : participants;
  const hidden = participants.length - visible.length;

  if (participants.length === 0) {
    return (
      <div
        className="neo-card p-6 text-center"
        style={{ background: "var(--color-muted)" }}
      >
        <p className="text-3xl mb-2" aria-hidden="true">🪑</p>
        <p className="font-bold text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          No participants yet. Be the first to join!
        </p>
      </div>
    );
  }

  return (
    <div>
      <p
        className="text-sm font-bold mb-3"
        style={{ color: "var(--color-muted-foreground)" }}
        aria-live="polite"
      >
        {participants.length} participant{participants.length !== 1 ? "s" : ""}
      </p>

      <ul className="space-y-2" aria-label="Participant list">
        {visible.map((p) => {
          const isCurrentUser = p.user_id === currentUserId;
          return (
            <li
              key={p.id}
              className={`neo-card flex items-center gap-3 px-3 py-2.5 ${isCurrentUser ? "text-zinc-900 dark:text-zinc-900" : ""}`}
              style={{
                background: isCurrentUser ? "#eff6ff" : undefined,
                boxShadow: isCurrentUser
                  ? "var(--shadow-neo-primary)"
                  : "var(--shadow-neo)",
              }}
              aria-label={`${p.user.username}, number ${p.selected_number}${isCurrentUser ? ", you" : ""}`}
            >
              {/* Avatar */}
              <span className="relative flex-shrink-0 w-9 h-9 border-2 border-[var(--color-border)] overflow-hidden">
                {p.user.avatar_url ? (
                  <Image
                    src={p.user.avatar_url}
                    alt={p.user.username}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className="flex items-center justify-center w-full h-full text-sm font-black"
                    style={{ background: "var(--color-accent)" }}
                    aria-hidden="true"
                  >
                    {p.user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              {/* Username */}
              <span className="flex-1 font-bold text-sm truncate">
                {p.user.username}
                {isCurrentUser && (
                  <span
                    className="ml-1 text-xs font-medium"
                    style={{ color: "var(--color-primary)" }}
                  >
                    (you)
                  </span>
                )}
              </span>

              {/* Selected number badge */}
              <span
                className="neo-badge neo-badge-muted tabular-nums text-xs flex-shrink-0"
                aria-label={`Picked number ${p.selected_number}`}
              >
                #{p.selected_number}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Hidden count */}
      {hidden > 0 && (
        <p
          className="mt-2 text-sm text-center font-medium"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          + {hidden} more participant{hidden !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
