"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠", id: "mobile-nav-home" },
  { href: "/rooms/create", label: "Create", icon: "➕", id: "mobile-nav-create" },
  { href: "/rooms/history", label: "History", icon: "📜", id: "mobile-nav-history" },
  { href: "/profile", label: "Profile", icon: "👤", id: "mobile-nav-profile" },
];

/**
 * MobileNav — bottom navigation bar for mobile viewports.
 * Only visible on small screens (md:hidden).
 */
export function MobileNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const activeNavItems = [...NAV_ITEMS];
  if (isAdmin) {
    activeNavItems.push({ href: "/admin", label: "Admin", icon: "🛡️", id: "mobile-nav-admin" });
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 mobile-nav-container"
      style={{
        background: "var(--color-background)",
        borderTop: "3px solid var(--color-border)",
        boxShadow: "0 -3px 0px var(--color-border)",
      }}
      aria-label="Mobile navigation"
    >
      <ul className="flex items-stretch" role="list">
        {activeNavItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                id={item.id}
                className="flex flex-col items-center justify-center gap-0.5 py-2 h-14 w-full transition-colors"
                style={{
                  background: isActive ? "var(--color-accent)" : "transparent",
                  borderRight: "1px solid var(--color-border)",
                  fontFamily: "var(--font-display)",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-xl" aria-hidden="true">
                  {item.icon}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: isActive ? "var(--color-accent-foreground)" : "var(--color-muted-foreground)" }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
