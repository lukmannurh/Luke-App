"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="brutal-press-sm flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold"
      style={{
        background: "var(--color-lime)",
        color: "var(--color-lime-foreground)",
        fontFamily: "var(--font-display)",
      }}
      aria-label="Install App"
    >
      <Download className="h-4 w-4" strokeWidth={2.5} />
      Install
    </button>
  );
}
