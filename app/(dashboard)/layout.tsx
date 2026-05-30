import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

/**
 * Dashboard layout — wraps all authenticated pages.
 * Auth protection is handled by proxy.ts middleware.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if ((profile as any)?.role === "admin") {
      isAdmin = true;
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <Footer />
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
