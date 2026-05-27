import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/services/users.service";
import { formatTimestamp } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "My Profile — Giveaway App",
  description: "View your giveaway participation history, wins, and stats.",
};

/**
 * Profile Page — Server Component.
 * Shows the logged-in user's profile, stats, and participation history.
 * Redirects to /login if not authenticated.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const profile = await getUserProfile(supabase, authUser.id).catch(() => null);

  if (!profile) {
    return (
      <div className="neo-card p-8 text-center max-w-md mx-auto">
        <p className="text-xl" aria-hidden="true">😕</p>
        <p className="font-bold mt-2">Could not load your profile. Please refresh.</p>
      </div>
    );
  }

  const winRate =
    profile.stats.totalParticipations > 0
      ? Math.round(
          (profile.stats.totalWins / profile.stats.totalParticipations) * 100
        )
      : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="neo-card p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative w-16 h-16 flex-shrink-0 border-3 border-[var(--color-border)]">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-black"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
              >
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-black truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {profile.username}
            </h1>
            <p className="text-sm truncate" style={{ color: "var(--color-muted-foreground)" }}>
              {profile.email}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3" aria-label="Your statistics">
        <StatCard
          value={profile.stats.totalParticipations}
          label="Joined"
          emoji="🎫"
          variant="default"
        />
        <StatCard
          value={profile.stats.totalWins}
          label="Won"
          emoji="🏆"
          variant="accent"
        />
        <StatCard
          value={profile.stats.totalRoomsHosted}
          label="Hosted"
          emoji="👑"
          variant="default"
        />
      </div>

      {/* Win rate */}
      {profile.stats.totalParticipations > 0 && (
        <div
          className="neo-card p-4 flex items-center gap-3"
          style={{ background: "var(--color-muted)" }}
        >
          <span className="text-2xl" aria-hidden="true">🎯</span>
          <div>
            <p className="font-black text-lg" style={{ fontFamily: "var(--font-display)" }}>
              {winRate}% win rate
            </p>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              {profile.stats.totalWins} win{profile.stats.totalWins !== 1 ? "s" : ""} from{" "}
              {profile.stats.totalParticipations} participation
              {profile.stats.totalParticipations !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Participation history */}
      <section aria-label="Participation history">
        <h2
          className="text-xl font-black mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Participation History
        </h2>

        {profile.participations.length === 0 ? (
          <div className="neo-card p-8 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">🎪</div>
            <p className="font-bold" style={{ color: "var(--color-muted-foreground)" }}>
              You haven't joined any giveaways yet.
            </p>
            <Link href="/" className="neo-btn neo-btn-primary mt-4 inline-flex">
              Browse Rooms
            </Link>
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Your giveaway participation history">
            {profile.participations.map((p) => (
              <li key={`${p.roomId}-${p.selectedNumber}`}>
                <Link
                  href={`/rooms/${p.roomId}`}
                  id={`profile-history-${p.roomId}`}
                  className="block neo-card p-4 neo-card-hover"
                  aria-label={`${p.roomTitle} — ${p.isWinner ? "You won!" : "Didn't win"}`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Winner indicator */}
                    <span
                      className="text-xl flex-shrink-0"
                      aria-hidden="true"
                    >
                      {p.isWinner ? "🏆" : "🎫"}
                    </span>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{p.roomTitle}</p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        {formatTimestamp(p.joinedAt)} · picked #{p.selectedNumber}
                      </p>
                    </div>

                    {/* Status badges */}
                    <div className="flex gap-2 flex-shrink-0">
                      {p.isWinner && (
                        <span className="neo-badge neo-badge-accent text-xs">Winner!</span>
                      )}
                      {p.roomState === "active" && (
                        <span className="neo-badge neo-badge-active text-xs">Active</span>
                      )}
                      {p.roomState === "finished" && !p.isWinner && (
                        <span className="neo-badge neo-badge-muted text-xs">Ended</span>
                      )}
                      {p.roomState === "drawing" && (
                        <span className="neo-badge neo-badge-drawing text-xs">Drawing</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

// ── Stat Card sub-component ────────────────────────────────────────────────

function StatCard({
  value,
  label,
  emoji,
  variant,
}: {
  value: number;
  label: string;
  emoji: string;
  variant: "default" | "accent";
}) {
  return (
    <div
      className="neo-card p-4 text-center"
      style={{
        background: variant === "accent" ? "var(--color-accent)" : undefined,
      }}
    >
      <div className="text-2xl" aria-hidden="true">{emoji}</div>
      <div
        className="text-3xl font-black tabular-nums mt-1"
        style={{ fontFamily: "var(--font-display)" }}
        aria-label={`${value} ${label}`}
      >
        {value}
      </div>
      <div
        className="text-xs font-bold mt-0.5"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        {label}
      </div>
    </div>
  );
}
