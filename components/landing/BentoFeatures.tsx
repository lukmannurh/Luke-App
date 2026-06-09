import { Coins, Timer, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cookies } from "next/headers";
import { dictionaries, Language } from "@/lib/i18n/dictionaries";

type Feature = {
  emoji: string;
  icon: LucideIcon;
  titleKey: "feat1Title" | "feat2Title" | "feat3Title";
  descKey: "feat1Desc" | "feat2Desc" | "feat3Desc";
  bg: string;
  fg: string;
};

const features: Feature[] = [
  {
    emoji: "🪙",
    icon: Coins,
    titleKey: "feat1Title",
    descKey: "feat1Desc",
    bg: "bg-coin",
    fg: "text-coin-foreground",
  },
  {
    emoji: "🤖",
    icon: Timer,
    titleKey: "feat2Title",
    descKey: "feat2Desc",
    bg: "bg-sky",
    fg: "text-sky-foreground",
  },
  {
    emoji: "⚡",
    icon: Zap,
    titleKey: "feat3Title",
    descKey: "feat3Desc",
    bg: "bg-pink",
    fg: "text-pink-foreground",
  },
];

export async function BentoFeatures() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const language = (localeCookie?.value === "id" ? "id" : "en") as Language;
  const t = (key: keyof typeof dictionaries.en) => dictionaries[language][key] || dictionaries.en[key] || key;

  return (
    <section className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-5 font-display text-3xl leading-none">
        {t("bentoBuiltFor")}
        <br />
        <span className="bg-lime px-2 text-lime-foreground">{t("bentoThumb")}</span>
      </h2>

      <div className="flex flex-col gap-4">
        {features.map((f, i) => (
          <article
            key={f.titleKey}
            style={{ animationDelay: `${i * 80}ms` }}
            className={`brutal-press animate-rise flex min-h-[48px] items-start gap-4 rounded-2xl ${f.bg} ${f.fg} p-4`}
          >
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-xl border-[3px] border-border bg-card text-3xl">
              {f.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <f.icon className="h-5 w-5" strokeWidth={2.5} />
                <h3 className="font-display text-xl leading-none">{t(f.titleKey)}</h3>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug">{t(f.descKey)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
