"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, User, ShieldAlert, MessageCircle } from "lucide-react";
import { InstallPWA } from "@/components/ui/InstallPWA";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/rooms", label: "Home", icon: Home, id: "mobile-nav-home" },
  { href: "/rooms/history", label: "History", icon: History, id: "mobile-nav-history" },
  { href: "/profile", label: "Profile", icon: User, id: "mobile-nav-profile" },
  { href: "/admin", label: "Admin", icon: ShieldAlert, id: "mobile-nav-admin" },
];

/**
 * Lovable-style bottom navigation bar.
 * Centre slot is the "Create" FAB that lifts above the bar.
 */
export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
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
        (payload) => {
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

  const isChatActive = pathname === "/chat";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-50 border-t-[3px] border-border bg-background"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-md items-end justify-between gap-2 px-4 py-2">
        {/* Left: Home */}
        <NavTab
          href={navItems[0].href}
          label={navItems[0].label}
          Icon={navItems[0].icon}
          id={navItems[0].id}
          active={pathname === "/rooms" || pathname.startsWith("/rooms/") && !pathname.startsWith("/rooms/history") && !pathname.startsWith("/rooms/create")}
        />

        {/* Centre: Chat FAB */}
        <Link
          href="/chat"
          id="mobile-nav-chat"
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl transition-all relative ${
            isChatActive
              ? "brutal-press -mt-6 -translate-y-4 bg-lime text-lime-foreground shadow-lg scale-110"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Global Chat"
        >
          <MessageCircle className="h-7 w-7" strokeWidth={isChatActive ? 3 : 2.5} />
          <span className="font-display text-[10px] leading-none mt-1">Chat</span>
          {hasUnread && (
            <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-[#FF4500] border-2 border-black"></span>
          )}
        </Link>

        {/* Right: History + Profile + Admin */}
        <NavTab
          href={navItems[1].href}
          label={navItems[1].label}
          Icon={navItems[1].icon}
          id={navItems[1].id}
          active={pathname.startsWith("/rooms/history")}
        />
        <NavTab
          href={navItems[2].href}
          label={navItems[2].label}
          Icon={navItems[2].icon}
          id={navItems[2].id}
          active={pathname.startsWith("/profile")}
        />
        {isAdmin && (
          <NavTab
            href={navItems[3].href}
            label={navItems[3].label}
            Icon={navItems[3].icon}
            id={navItems[3].id}
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
}: {
  href: string;
  label: string;
  Icon: any;
  id: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      id={id}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 font-display text-[11px] transition-colors ${
        active ? "text-foreground brutal bg-card border-border shadow-neo-sm" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={`h-6 w-6 transition-transform ${active ? "scale-110" : ""}`} strokeWidth={2.5} />
      {label}
    </Link>
  );
}
