import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";

/**
 * Dashboard layout — wraps all authenticated pages.
 * Auth protection is handled by proxy.ts middleware.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
