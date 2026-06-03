import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";
import { UserMenu } from "@/components/auth/UserMenu";

/**
 * AppHeader — Lovable-style sticky header.
 * Shows: Giveaway App logo | coin balance + theme toggle (right side).
 * Server Component: fetches user/profile for coin display.
 */
export async function Header() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile: User | null = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    profile = data as User | null;
  }

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-border bg-background">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
        {/* Logo */}
        <Link href="/rooms" className="flex items-center gap-2" id="header-logo" aria-label="Giveaway App home">
          <Image src="/Luke.png" alt="Giveaway App" width={40} height={40} className="rounded-xl object-cover" />
          <span className="font-display text-lg leading-none tracking-tight">Giveaway App</span>
        </Link>

        {/* Right: coin balance + theme */}
        <div className="flex items-center gap-2">
          {profile && (
            <span className="brutal flex h-10 items-center gap-1 rounded-xl bg-coin px-3 font-display text-sm text-coin-foreground">
              🪙 {profile.credits.toLocaleString()}
            </span>
          )}
          <ThemeToggleButton />
          {profile ? (
            <UserMenu user={profile} />
          ) : (
            <Link
              href="/login"
              id="header-signin"
              className="brutal-press-sm flex h-10 items-center rounded-xl bg-primary px-3 font-display text-sm text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
