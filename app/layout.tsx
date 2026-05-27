import type { Metadata } from "next";
import "@/app/globals.css";
import { Space_Grotesk, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Giveaway App — Community Giveaway Platform",
    template: "%s | Giveaway App",
  },
  description:
    "Fair, transparent, and exciting giveaways for your community. Select your lucky number and let the draw decide your fate.",
  keywords: ["giveaway", "community", "lucky draw", "winner", "raffle"],
  authors: [{ name: "Giveaway App" }],
  robots: "index, follow",
  openGraph: {
    title: "Giveaway App — Community Giveaway Platform",
    description:
      "Fair, transparent, and exciting giveaways for your community.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, spaceGrotesk.variable)}>
      <head />
      <body className="antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
        {/* Skip to main content — first focusable element for keyboard/screen reader users */}
        <a href="#main-content" className="skip-to-content sr-only focus:not-sr-only">
          Skip to main content
        </a>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "neo-card font-bold border-3 border-[var(--color-border)] shadow-neo",
              success: "!border-[var(--color-success)] !shadow-[var(--shadow-neo-success)]",
              error: "!border-[var(--color-destructive)] !shadow-[var(--shadow-neo-destructive)]",
              info: "!border-[var(--color-primary)] !shadow-[var(--shadow-neo-primary)]",
            },
          }}
        />
        <SpeedInsights />
      </body>

    </html>
  );
}

