import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UpdateUsernameForm } from "@/components/profile/UpdateUsernameForm";
import { UpdatePasswordForm } from "@/components/profile/UpdatePasswordForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { CreditHistory } from "@/components/profile/CreditHistory";
import { StateBadge } from "@/components/rooms/RoomCard";
import { formatDistanceToNow } from "date-fns";

import { LanguageSelector } from "@/components/profile/LanguageSelector";

export const metadata = {
  title: "Your Profile — Giveaway App",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all user data in parallel
  const [
    { data: profile },
    { data: participations },
    { count: hostedCount },
    { count: winCount },
    { data: transactions },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("participants")
      .select("room_id, selected_number, rooms(id, title, state, deadline)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("rooms").select("id", { count: "exact", head: true }).eq("host_id", user.id),
    supabase.from("winners").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const p = profile as any;
  const isGuest = user.user_metadata?.is_guest === true;

  return (
    <>
      <h1 className="font-display text-3xl leading-tight tracking-tight">Your Profile</h1>
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        Manage your account and view your giveaway history.
      </p>

      {/* Avatar + identity card */}
      <div className="brutal mt-5 flex items-center gap-4 rounded-2xl bg-accent p-5 text-accent-foreground">
        <div className="brutal flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime text-lime-foreground border-2 border-black">
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-2xl">🦊</span>
          )}
        </div>
        <div>
          <p className="font-display text-xl leading-none">{p?.username ?? "Anonymous"}</p>
          <p className="mt-1 text-sm font-medium">{isGuest ? "Guest account" : user.email}</p>
          <span className="brutal-press-sm mt-2 inline-flex rounded-lg bg-coin px-2.5 py-0.5 font-display text-sm text-coin-foreground">
            🪙 {(p?.credits ?? 0).toLocaleString()} credits
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Joined" value={participations?.length ?? 0} accent="bg-sky text-sky-foreground" />
        <Stat label="Wins" value={winCount ?? 0} accent="bg-lime text-lime-foreground" />
        <Stat label="Hosted" value={hostedCount ?? 0} accent="bg-pink text-pink-foreground" />
      </div>

      {/* Transactions */}
      <CreditHistory transactions={transactions || []} />

      {/* Recent activity */}
      {participations && participations.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-lg">Recent Activity</h2>
          <div className="mt-3 flex flex-col gap-2">
            {(participations as any[]).map((p) => {
              const room = p.rooms;
              if (!room) return null;
              return (
                <Link
                  key={p.room_id + p.selected_number}
                  href={`/rooms/${room.id}`}
                  className="brutal-press flex items-center justify-between gap-2 rounded-xl bg-card p-3 text-card-foreground"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{room.title}</p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Number #{p.selected_number} · {formatDistanceToNow(new Date(room.deadline), { addSuffix: true })}
                    </p>
                  </div>
                  <StateBadge state={room.state} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Account settings */}
      <section className="mt-6">
        <h2 className="font-display text-lg">Account Settings</h2>
        <div className="mt-3 flex flex-col gap-4">


          <div className="brutal rounded-2xl bg-card p-5 text-card-foreground">
            <h3 className="font-display text-base">Language / Bahasa</h3>
            <div className="mt-3">
              <LanguageSelector />
            </div>
          </div>
          <div className="brutal rounded-2xl bg-card p-5 text-card-foreground">
            <h3 className="font-display text-base">Change Username</h3>
            <div className="mt-3">
              <UpdateUsernameForm currentUsername={p?.username ?? ""} />
            </div>
          </div>
          <div className="brutal rounded-2xl bg-card p-5 text-card-foreground">
            <h3 className="font-display text-base">Change Password</h3>
            <div className="mt-3">
              <UpdatePasswordForm />
            </div>
          </div>
          <div className="brutal rounded-2xl bg-card p-5 text-card-foreground">
            <h3 className="font-display text-base">Profile Photo</h3>
            <div className="mt-3">
              <AvatarUpload currentAvatar={p?.avatar_url ?? null} userId={user.id} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`brutal rounded-2xl p-4 text-center ${accent}`}>
      <p className="font-display text-2xl leading-none">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}
