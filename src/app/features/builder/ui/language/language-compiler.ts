import { SetLanguage } from "language-management-lib";

export interface LanguageObject {
  setLanguage: (language: string, updateURL?: boolean) => void;
  translate: (key: string) => string;
  getCurrentLanguage: () => string;
  getAvailableLanguages: () => string[];
  addTranslations: (
    language: string,
    translations: Record<string, string>
  ) => void;
  getLanguageData: () => Record<string, Record<string, string>>;
}

class LanguageCache {
  private cache = new Map<string, LanguageObject | null>();

  private generateCacheKey(componentName: string, content: string): string {
    return `${componentName}:${content.length}:${this.hashCode(content)}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }

  get(
    componentName: string,
    content: string
  ): LanguageObject | null | undefined {
    const key = this.generateCacheKey(componentName, content);
    return this.cache.get(key);
  }

  set(
    componentName: string,
    content: string,
    languageObject: LanguageObject | null
  ): void {
    const key = this.generateCacheKey(componentName, content);
    this.cache.set(key, languageObject);
  }

  clear(): void {
    this.cache.clear();
  }

  clearForComponent(componentName: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${componentName}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  get size(): number {
    return this.cache.size;
  }
}

const languageCache = new LanguageCache();

function createMockRequire(): (moduleName: string) => unknown {
  return (moduleName: string): unknown => {
    if (moduleName === "language-management-lib") {
      // Return an object that supports both named export and default export
      return {
        SetLanguage,
        default: SetLanguage,
        __esModule: true,
      };
    }
    throw new Error(`Module ${moduleName} not found in runtime environment`);
  };
}

function createModuleContext(
  tsContent: string
): (exports: unknown, require: (moduleName: string) => unknown) => unknown {
  return new Function(
    "exports",
    "require",
    `
      const module = { exports: {} };

      ${tsContent}

      // The compiled code should have created variables and exports
      // Try to find the language instance from various possible sources
      let languageInstance = null;
      
      // Check for exported lng variable (most common case)
      if (typeof lng !== 'undefined') {
        languageInstance = lng;
        module.exports.lng = lng;
      }
      
      // Check for other common variable names
      if (!languageInstance && typeof languageManager !== 'undefined') {
        languageInstance = languageManager;
        module.exports.languageManager = languageManager;
      }
      
      // Set as default export if we found an instance
      if (languageInstance && !module.exports.default) {
        module.exports.default = languageInstance;
      }

      return module.exports;
    `
  ) as (exports: unknown, require: (moduleName: string) => unknown) => unknown;
}

function extractLanguageObject(
  moduleExports: unknown
): SetLanguage<Record<string, Record<string, string>>> | null {
  if (moduleExports && typeof moduleExports === "object") {
    const defaultExport = (moduleExports as Record<string, unknown>).default;
    if (
      defaultExport &&
      typeof defaultExport === "object" &&
      "translate" in defaultExport
    ) {
      return defaultExport as SetLanguage<
        Record<string, Record<string, string>>
      >;
    }
  }

  if (moduleExports && typeof moduleExports === "object") {
    const languageObject = Object.values(
      moduleExports as Record<string, unknown>
    ).find(
      (exp: unknown) =>
        exp && typeof exp === "object" && "translate" in (exp as object)
    );

    if (languageObject) {
      return languageObject as SetLanguage<
        Record<string, Record<string, string>>
      >;
    }
  }

  return null;
}

export function compileLanguageObject(
  tsContent: string
): LanguageObject | null {
  if (!tsContent?.trim()) {
    return null;
  }

  try {
    const moduleContext = createModuleContext(tsContent);
    const mockRequire = createMockRequire();
    const moduleExports = moduleContext({}, mockRequire);

    const setLanguageInstance = extractLanguageObject(moduleExports);

    if (!setLanguageInstance) {
      return null;
    }

    // Return a language object that matches the interface
    return {
      setLanguage: (language: string, updateURL?: boolean) =>
        setLanguageInstance.setLanguage(language, updateURL),
      translate: (key: string) => setLanguageInstance.translate(key),
      getCurrentLanguage: () => setLanguageInstance.getCurrentLanguage(),
      getAvailableLanguages: () => setLanguageInstance.getAvailableLanguages(),
      addTranslations: (
        language: string,
        translations: Record<string, string>
      ) => setLanguageInstance.addTranslations(language, translations),
      getLanguageData: () => setLanguageInstance.getLanguageData(),
    };
  } catch (error) {
    console.warn("Failed to compile language object:", {
      error: error instanceof Error ? error.message : String(error),
      contentPreview: tsContent.substring(0, 100) + "...",
    });
    return null;
  }
}

export function getCompiledLanguage(
  componentName: string,
  languageContent?: string
): LanguageObject | null {
  if (!languageContent?.trim() || !componentName) {
    return null;
  }

  const cached = languageCache.get(componentName, languageContent);
  if (cached !== undefined) {
    return cached;
  }

  const compiled = compileLanguageObject(languageContent);
  languageCache.set(componentName, languageContent, compiled);

  return compiled;
}

export function clearLanguageCache(): void {
  languageCache.clear();
}

export function clearLanguageCacheForComponent(componentName: string): void {
  languageCache.clearForComponent(componentName);
}

export function getLanguageCacheStats(): { size: number } {
  return {
    size: languageCache.size,
  };
}
