import type { Metadata } from "next";
import "@/app/globals.css";
import { Space_Grotesk, Archivo_Black } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { cookies } from "next/headers";
import { Language } from "@/lib/i18n/dictionaries";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const initialLang = (localeCookie?.value === "id" ? "id" : "en") as Language;

  return (
    <html lang="en" className={cn(spaceGrotesk.variable, archivoBlack.variable, "w-full max-w-full overflow-x-hidden")} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors duration-300 w-full max-w-full overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider initialLanguage={initialLang}>
            {/* Skip to main content — first focusable element for keyboard/screen reader users */}
            <a href="#main-content" className="skip-to-content sr-only focus:not-sr-only">
              Skip to main content
            </a>
            {children}
          </LanguageProvider>
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
        </ThemeProvider>
      </body>

    </html>
  );
}

