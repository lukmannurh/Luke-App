import { Download, ExternalLink, LogIn } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { dictionaries, Language } from "@/lib/i18n/dictionaries";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

export async function Hero() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const language = (localeCookie?.value === "id" ? "id" : "en") as Language;
  const t = (key: keyof typeof dictionaries.en) => dictionaries[language][key] || dictionaries.en[key] || key;

  return (
    <section className="mx-auto max-w-md px-4 pb-6 pt-8">
      <span className="brutal inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-foreground">
        Community Giveaway · PWA
      </span>

      <h1 className="mt-4 font-display text-[2.9rem] leading-[0.92] tracking-tight">
        {t("heroTitle1")}
        <br />
        <span className="ml-6 inline-block bg-lime px-2 text-lime-foreground">{t("heroTitle2")}</span>
        <br />
        <span className="ml-2 inline-block -rotate-2 bg-sky px-2 text-sky-foreground">{t("heroTitle3")}</span>
      </h1>

      <p className="mt-5 text-base font-medium leading-snug text-muted-foreground">
        {t("heroDesc")}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <a
          href="/release/app.apk"
          download="LukeApp.apk"
          id="hero-open-app"
          className="brutal-press flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 sm:px-8 sm:py-4 font-display text-lg text-primary-foreground"
        >
          <Download className="h-6 w-6" strokeWidth={2.5} />
          {t("ctaDownload")}
        </a>
        <Link
          href="/login"
          id="hero-signin"
          className="brutal-press flex w-full items-center justify-center gap-2 rounded-xl bg-card px-4 py-3 sm:px-8 sm:py-4 font-display text-lg text-card-foreground"
        >
          <LogIn className="h-6 w-6" strokeWidth={2.5} />
          Sign In / Guest
        </Link>
      </div>

      <div className="mt-10">
        <PhoneMockup />
      </div>
    </section>
  );
}
