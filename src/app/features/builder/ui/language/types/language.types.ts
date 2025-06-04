export interface LanguageFlag {
  flag: string;
  name: string;
}

export interface LanguageEntry {
  code: string;
  name: string;
  translations: Record<string, string>;
}

export interface LanguageEditorProps {
  onLanguageChange?: (language: string) => void;
}

export interface LanguageConfigProps {
  onClose?: () => void;
}

export interface LanguageObject {
  setLanguage: (language: string, updateURL?: boolean) => void;
  translate: (key: string) => string;
  translateWithFallback: (key: string, fallbackLanguage?: string) => string;
  getCurrentLanguage: () => string;
  getAvailableLanguages: () => string[];
  addTranslations: (
    language: string,
    translations: Record<string, string>
  ) => void;
  getLanguageData: () => Record<string, Record<string, string>>;
  getTranslations: (language: string) => Record<string, string>;
  getTranslationsWithFallback: (
    language: string,
    fallbackLanguage?: string
  ) => Record<string, string>;
  addLanguage: (language: string, translations: Record<string, string>) => void;
  updateTranslations: (
    language: string,
    translations: Record<string, string>
  ) => void;
  getUpdatedContent: () => string;
}
