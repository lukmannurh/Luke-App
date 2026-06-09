"use client";

import { useTranslation } from "@/components/i18n/LanguageContext";

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setLanguage("en")}
        className={`brutal-press flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${
          language === "en"
            ? "bg-primary text-primary-foreground border-2 border-black"
            : "bg-muted text-muted-foreground border-2 border-transparent"
        }`}
      >
        {t("english")}
      </button>
      <button
        onClick={() => setLanguage("id")}
        className={`brutal-press flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${
          language === "id"
            ? "bg-primary text-primary-foreground border-2 border-black"
            : "bg-muted text-muted-foreground border-2 border-transparent"
        }`}
      >
        {t("indonesia")}
      </button>
    </div>
  );
}
