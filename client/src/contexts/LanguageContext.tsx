import { createContext, useContext, useState, useLayoutEffect } from "react";
import enTranslations from "../translations/en.json";
import frTranslations from "../translations/fr.json";

type Language = "en" | "fr";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const translationsMap: Record<Language, Record<string, string>> = {
  en: enTranslations,
  fr: frTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("language") as Language | null;
    return stored || "en";
  });

  const [translations, setTranslations] = useState<Record<string, string>>(translationsMap[language] || enTranslations);

  useLayoutEffect(() => {
    setTranslations(translationsMap[language] || enTranslations);
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
