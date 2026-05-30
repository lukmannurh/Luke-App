"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="w-10 h-10 flex items-center justify-center border-2 border-[var(--color-border)] bg-[var(--color-background)]"
        style={{ boxShadow: "2px 2px 0px var(--color-border)" }}
        aria-label="Toggle theme"
      >
        <span className="opacity-0">☀️</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 flex items-center justify-center border-2 border-[var(--color-border)] transition-colors hover:bg-[var(--color-muted)]"
      style={{ 
        boxShadow: "2px 2px 0px var(--color-border)",
        background: theme === "dark" ? "var(--color-muted)" : "var(--color-background)"
      }}
      aria-label="Toggle theme"
    >
      <span className="text-lg" aria-hidden="true">
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
