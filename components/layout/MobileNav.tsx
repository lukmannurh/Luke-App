"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, User, ShieldAlert, MessageCircle } from "lucide-react";
import { InstallPWA } from "@/components/ui/InstallPWA";
import { createClient } from "@/lib/supabase/client";

import { useTranslation } from "@/components/i18n/LanguageContext";

const navItems = [
  { href: "/rooms", labelKey: "home" as const, icon: Home, id: "mobile-nav-home" },
  { href: "/chat", labelKey: "chat" as const, icon: MessageCircle, id: "mobile-nav-chat" },
  { href: "/rooms/history", labelKey: "history" as const, icon: History, id: "mobile-nav-history" },
  { href: "/profile", labelKey: "profile" as const, icon: User, id: "mobile-nav-profile" },
  { href: "/admin", labelKey: "Admin" as const, icon: ShieldAlert, id: "mobile-nav-admin" },
];

/**
 * Lovable-style bottom navigation bar.
 * Uniform active states with Neobrutalist blocks.
 */
export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [hasUnread, setHasUnread] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Clear unread badge if we are on chat
    if (pathname === "/chat") {
      setHasUnread(false);
    }
  }, [pathname]);

  useEffect(() => {
    // Subscribe to global chat
    const channel = supabase
      .channel("mobile-nav-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_chat" },
        () => {
          if (pathname !== "/chat") {
            setHasUnread(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname, supabase]);

  if (pathname === "/") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-50 border-t-[3px] border-border bg-background"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-md items-end justify-between gap-1 px-2 py-2 relative">
        <NavTab
          href={navItems[0].href}
          label={t(navItems[0].labelKey as any)}
          Icon={navItems[0].icon}
          id={navItems[0].id}
          active={pathname === "/rooms" || pathname.startsWith("/rooms/") && !pathname.startsWith("/rooms/history") && !pathname.startsWith("/rooms/create")}
        />
        <NavTab
          href={navItems[1].href}
          label={t(navItems[1].labelKey as any)}
          Icon={navItems[1].icon}
          id={navItems[1].id}
          active={pathname === "/chat"}
          badge={hasUnread}
        />
        <NavTab
          href={navItems[2].href}
          label={t(navItems[2].labelKey as any)}
          Icon={navItems[2].icon}
          id={navItems[2].id}
          active={pathname.startsWith("/rooms/history")}
        />
        <NavTab
          href={navItems[3].href}
          label={t(navItems[3].labelKey as any)}
          Icon={navItems[3].icon}
          id={navItems[3].id}
          active={pathname.startsWith("/profile")}
        />
        {isAdmin && (
          <NavTab
            href={navItems[4].href}
            label={t(navItems[4].labelKey as any)}
            Icon={navItems[4].icon}
            id={navItems[4].id}
            active={pathname.startsWith("/admin")}
          />
        )}
        
        {/* PWA Install Button inline on mobile */}
        <div className="absolute -top-12 right-4">
          <InstallPWA />
        </div>
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  Icon,
  id,
  active,
  badge,
}: {
  href: string;
  label: string;
  Icon: any;
  id: string;
  active: boolean;
  badge?: boolean;
}) {
  return (
    <Link
      href={href}
      id={id}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 font-display text-[11px] transition-all ${
        active 
          ? "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground px-1" 
          : "bg-transparent text-muted-foreground hover:text-foreground border-2 border-transparent px-1"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
      {label}
      {badge && (
        <span className="absolute top-1 right-2 h-3 w-3 rounded-full bg-[#FF4500] border-2 border-black"></span>
      )}
    </Link>
  );
}
