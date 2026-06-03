"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="brutal-press-sm flex h-11 w-11 items-center justify-center rounded-xl bg-card text-card-foreground"
      >
        <span className="opacity-0 h-6 w-6" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="brutal-press-sm flex h-11 w-11 items-center justify-center rounded-xl bg-card text-card-foreground"
    >
      {theme === "dark" ? (
        <Sun className="h-6 w-6" strokeWidth={2.5} />
      ) : (
        <Moon className="h-6 w-6" strokeWidth={2.5} />
      )}
    </button>
  );
}
