import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin Dashboard | Giveaway App",
};

export default async function AdminPage() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  // Initialize service role client for admin stats
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Total Users (Auth)
  const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  let totalUsers = 0;
  let guestUsers = 0;
  let verifiedUsers = 0;

  if (authUsers?.users) {
    totalUsers = authUsers.users.length;
    guestUsers = authUsers.users.filter((u) => u.user_metadata?.is_guest === true).length;
    verifiedUsers = totalUsers - guestUsers;
  }

  // 2. Active Rooms (state = 'active' or 'drawing')
  const { count: activeRoomsCount } = await supabaseAdmin
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .in("state", ["active", "drawing"]);

  // 3. Total Credits in Circulation
  const { data: allProfiles } = await supabaseAdmin
    .from("users")
    .select("credits");
    
  const totalCredits = allProfiles?.reduce((acc: number, curr: any) => acc + (curr.credits || 0), 0) || 0;

  // 4. Total Prize Distributed
  const { data: prizeTransactions } = await supabaseAdmin
    .from("transactions")
    .select("amount")
    .eq("description", "Won Giveaway");
  const totalPrizeDistributed = prizeTransactions?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;

  // 5. Recent Completed Draws
  const { data: recentCompletedRooms } = await supabaseAdmin
    .from("rooms")
    .select("id, title, drawing_completed_at")
    .eq("state", "finished")
    .order("drawing_completed_at", { ascending: false })
    .limit(5);

  // 6. System Health (Overdue Rooms missed by cron)
  const { count: overdueRoomsCount } = await supabaseAdmin
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .eq("state", "active")
    .lte("deadline", new Date().toISOString());

  return (
    <div className="flex flex-col gap-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Metric: Users */}
      <div className="neo-card p-6 flex flex-col justify-between">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Total Users
        </h2>
        <div>
          <div className="text-5xl font-black">{totalUsers}</div>
          <div className="mt-4 flex flex-col gap-2 text-sm font-medium">
            <div className="flex justify-between items-center border-b-2 border-[var(--color-border)] pb-1">
              <span>Verified Accounts</span>
              <span className="font-bold text-[var(--color-primary)]">{verifiedUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Guest Accounts</span>
              <span className="font-bold text-[var(--color-muted-foreground)]">{guestUsers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric: Active Rooms */}
      <div className="neo-card p-6 flex flex-col justify-between">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Active Rooms
        </h2>
        <div>
          <div className="text-5xl font-black text-green-600">{activeRoomsCount || 0}</div>
          <p className="mt-4 text-sm font-medium text-[var(--color-muted-foreground)]">
            Rooms currently open or drawing.
          </p>
        </div>
      </div>

      {/* Metric: Credits */}
      <div className="neo-card p-6 flex flex-col justify-between">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Credits Circulation
        </h2>
        <div>
          <div className="text-5xl font-black text-[var(--color-accent)]">{totalCredits}</div>
          <p className="mt-4 text-sm font-medium text-[var(--color-muted-foreground)]">
            Total sum of all user balances across the platform.
          </p>
        </div>
      </div>
    </div>

    {/* Row 2: More Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Metric: Total Prize Distributed */}
      <div className="neo-card p-6 flex flex-col justify-between">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Prize Distributed
        </h2>
        <div>
          <div className="text-5xl font-black text-[var(--color-primary)]">{totalPrizeDistributed}</div>
          <p className="mt-4 text-sm font-medium text-[var(--color-muted-foreground)]">
            Total credits awarded to giveaway winners.
          </p>
        </div>
      </div>

      {/* Metric: System Health */}
      <div className="neo-card p-6 flex flex-col justify-between" style={{ borderColor: overdueRoomsCount && overdueRoomsCount > 0 ? "var(--color-destructive)" : "var(--color-border)" }}>
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          System Health
        </h2>
        <div>
          <div className="text-5xl font-black" style={{ color: overdueRoomsCount && overdueRoomsCount > 0 ? "var(--color-destructive)" : "var(--color-success)" }}>
            {overdueRoomsCount && overdueRoomsCount > 0 ? `${overdueRoomsCount} Overdue` : "Healthy"}
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--color-muted-foreground)]">
            Active rooms past their deadline (checks if Vercel Cron is running).
          </p>
        </div>
      </div>

      {/* Metric: Recent Draws */}
      <div className="neo-card p-6 flex flex-col justify-between md:col-span-1">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Recent Draws
        </h2>
        <div className="flex flex-col gap-2">
          {recentCompletedRooms && recentCompletedRooms.length > 0 ? (
            recentCompletedRooms.map((r) => (
              <div key={r.id} className="text-sm font-bold border-b-2 border-[var(--color-border)] pb-2 truncate">
                {r.title}
              </div>
            ))
          ) : (
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">No recent draws.</p>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
