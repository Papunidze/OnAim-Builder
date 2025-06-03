import type { LanguageFlag } from "../types/language.types";

export const LANGUAGE_FLAGS: Record<string, LanguageFlag> = {
  en: { flag: "🇺🇸", name: "English" },
  ka: { flag: "🇬🇪", name: "Georgian" },
  ru: { flag: "🇷🇺", name: "Russian" },
  de: { flag: "🇩🇪", name: "German" },
  fr: { flag: "🇫🇷", name: "French" },
  es: { flag: "🇪🇸", name: "Spanish" },
  it: { flag: "🇮🇹", name: "Italian" },
  pt: { flag: "🇵🇹", name: "Portuguese" },
  nl: { flag: "🇳🇱", name: "Dutch" },
  pl: { flag: "🇵🇱", name: "Polish" },
  tr: { flag: "🇹🇷", name: "Turkish" },
  ja: { flag: "🇯🇵", name: "Japanese" },
  zh: { flag: "🇨🇳", name: "Chinese" },
  ar: { flag: "🇸🇦", name: "Arabic" },
};

export const DEFAULT_LANGUAGE = "en";
export const FALLBACK_FLAG = { flag: "🌐", name: "Unknown" };
