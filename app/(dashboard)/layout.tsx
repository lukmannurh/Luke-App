import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { GuestOnboardingModal } from "@/components/profile/GuestOnboardingModal";
import { createClient } from "@/lib/supabase/server";

// Layout fetches user profile via Supabase cookies — must be dynamic
export const dynamic = "force-dynamic";

/**
 * Dashboard layout — Lovable AppShell style.
 * Header (sticky top) + main content (max-w-md centered) + MobileNav (sticky bottom).
 * Auth protection is handled by proxy.ts middleware.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  let isAdmin = false;
  let isGuest = false;
  let username = null;

  if (session?.user) {
    isGuest = session.user.user_metadata?.is_guest === true;
    const { data } = await supabase.from('users').select('role, username').eq('id', session.user.id).single();
    const profile = data as { role: string, username: string } | null;
    isAdmin = profile?.role === 'admin';
    username = profile?.username || null;
  }
  return (
    <div className="flex min-h-screen flex-col bg-background w-full max-w-full overflow-x-hidden relative">
      <GuestOnboardingModal isGuest={isGuest} username={username} />
      <Header />
      <main
        id="main-content"
        className="animate-rise mx-auto w-full max-w-md flex-1 pt-24 pb-28 px-4"
      >
        {children}
      </main>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
