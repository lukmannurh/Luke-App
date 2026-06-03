"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, History, User, Plus, ShieldAlert } from "lucide-react";
import { InstallPWA } from "@/components/ui/InstallPWA";

const navItems = [
  { href: "/rooms", label: "Browse", icon: LayoutGrid, id: "mobile-nav-browse" },
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

  if (pathname === "/") return null;

  return (
    <nav
      className="sticky bottom-0 z-40 border-t-[3px] border-border bg-background"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-md items-end justify-between gap-2 px-4 py-2">
        {/* Left: Browse */}
        <NavTab
          href={navItems[0].href}
          label={navItems[0].label}
          Icon={navItems[0].icon}
          id={navItems[0].id}
          active={pathname === "/rooms" || pathname.startsWith("/rooms/") && !pathname.startsWith("/rooms/history") && !pathname.startsWith("/rooms/create")}
        />

        {/* Centre: Create FAB */}
        <Link
          href="/rooms/create"
          id="mobile-nav-create"
          className="brutal-press -mt-6 -translate-y-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-lime text-lime-foreground shadow-xl shadow-lime/20"
          aria-label="Create giveaway"
        >
          <Plus className="h-7 w-7" strokeWidth={3} />
          <span className="font-display text-[10px] leading-none">Create</span>
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
  Icon: typeof LayoutGrid;
  id: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      id={id}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 font-display text-[11px] transition-colors ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={`h-6 w-6 transition-transform ${active ? "scale-110" : ""}`} strokeWidth={2.5} />
      {label}
    </Link>
  );
}
