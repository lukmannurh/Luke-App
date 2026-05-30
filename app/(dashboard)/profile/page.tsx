import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdateUsernameForm } from "@/components/profile/UpdateUsernameForm";
import { UpdatePasswordForm } from "@/components/profile/UpdatePasswordForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Profile | Giveaway App",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile data
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile: any = data;

  if (!profile) {
    // If not found in users table, redirect to login
    redirect("/login");
  }

  // Fetch statistics
  // 1. Total rooms hosted
  const { count: hostedCount } = await supabase
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user.id);

  // 2. Total participations
  const { count: participationsCount } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // 3. Total wins
  const { count: winsCount } = await supabase
    .from("winners")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch participation history (rooms participated in)
  const { data: participations } = await supabase
    .from("participants")
    .select(`
      joined_at,
      selected_number,
      rooms (
        id,
        title,
        state,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .limit(10);

  // Fetch transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 w-full pb-8">
      <div>
        <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Your Profile</h1>
        <p className="text-[var(--color-muted-foreground)] text-sm font-medium">Manage your account and view your giveaway history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <AvatarUpload currentAvatar={profile.avatar_url} userId={user.id} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <UpdateUsernameForm currentUsername={profile.username} />
            <UpdatePasswordForm />
          </div>

          {/* Email Info */}
          <div className="neo-card p-6 flex flex-col gap-2">
            <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              Account Email
            </h2>
            <input
              type="text"
              readOnly
              value={profile.email}
              className="w-full px-3 py-3 text-sm font-medium border-3 border-[var(--color-border)] bg-[var(--color-muted)] outline-none opacity-70 cursor-not-allowed"
              style={{
                boxShadow: "2px 2px 0px var(--color-border)",
                minHeight: "44px",
              }}
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Your email cannot be changed.</p>
          </div>

          {/* Transaction History */}
          <div className="neo-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              Transaction Ledger
            </h2>
            <div className="flex flex-col gap-2">
              {transactions && transactions.length > 0 ? (
                transactions.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center p-3 border-2 border-[var(--color-border)] bg-[var(--color-background)]">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{t.description}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <span className={`font-black ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">No transactions yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & History */}
        <div className="flex flex-col gap-6">
          {/* Stats */}
          <div className="neo-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              Statistics
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-b-2 border-[var(--color-border)] pb-2">
                <span className="text-sm font-bold">Participations</span>
                <span className="text-xl font-black">{participationsCount || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b-2 border-[var(--color-border)] pb-2">
                <span className="text-sm font-bold">Total Wins</span>
                <span className="text-xl font-black text-green-600">{winsCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Rooms Hosted</span>
                <span className="text-xl font-black">{hostedCount || 0}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="neo-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              Recent Activity
            </h2>
            <div className="flex flex-col gap-3">
              {participations && participations.length > 0 ? (
                participations.map((p: any, i: number) => {
                  const room = p.rooms;
                  if (!room) return null;
                  return (
                    <Link 
                      key={i} 
                      href={`/rooms/${room.id}`}
                      className="block p-3 border-2 border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm truncate max-w-[150px]" title={room.title}>{room.title}</span>
                        <span className="text-xs uppercase font-bold px-2 py-0.5 bg-[var(--color-accent)] border border-[var(--color-border)]">
                          {room.state}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-[var(--color-muted-foreground)]">
                        <span>Number: <strong className="text-black">#{p.selected_number}</strong></span>
                        <span>{formatDistanceToNow(new Date(p.joined_at), { addSuffix: true })}</span>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
