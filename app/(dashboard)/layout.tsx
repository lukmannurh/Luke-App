import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
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
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.user_metadata?.role === 'admin';
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main
        id="main-content"
        className="animate-rise mx-auto w-full max-w-md flex-1 px-4 py-5 pb-24"
      >
        {children}
      </main>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
