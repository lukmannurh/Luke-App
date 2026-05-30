import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile as any).role !== "admin") {
    // Non-admins are redirected back to home
    redirect("/");
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-8">
      {/* Admin Header / Breadcrumb */}
      <div className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] p-6 border-4 border-[var(--color-border)] shadow-[4px_4px_0px_var(--color-border)]">
        <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-display)" }}>
          🛠️ Admin Dashboard
        </h1>
        <p className="mt-2 font-medium opacity-90">
          Platform analytics and management interface. Restricted to administrators.
        </p>
      </div>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
