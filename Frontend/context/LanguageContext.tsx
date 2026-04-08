import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "@/constants/i18n";
import { getSavedLanguage, saveLanguage, type AppLanguage } from "@/storage/tokenStorage";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string) => string;
  isLanguageLoading: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [isLanguageLoading, setIsLanguageLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await getSavedLanguage();
        if (!cancelled && saved) {
          setLanguageState(saved);
        }
      } finally {
        if (!cancelled) setIsLanguageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = async (next: AppLanguage) => {
    setLanguageState(next);
    await saveLanguage(next);
  };

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: string) =>
      translations[language][key] ?? translations.en[key] ?? key;
    return { language, setLanguage, t, isLanguageLoading };
  }, [language, isLanguageLoading]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

