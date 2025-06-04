import SetLanguage, { Language } from "language-management-lib";

const lngObject = {
  en: {
    title: "Leaderboards",
    button: "button",
  },
  ka: {
    title: "ლიდერბორდი",
  },
  ru: {
    title: "Таблица лидеров",
  },
} as const;

// type LanguageKeys = keyof typeof lngObject;

export type LngProps = typeof lngObject.en;

export type LanguageToProps<T extends Language> = {
  [K in keyof T]: {
    [P in keyof T[K]]: string;
  };
};

export const lng = new SetLanguage(lngObject, "en");
