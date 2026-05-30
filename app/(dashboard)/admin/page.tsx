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

  return (
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
  );
}
