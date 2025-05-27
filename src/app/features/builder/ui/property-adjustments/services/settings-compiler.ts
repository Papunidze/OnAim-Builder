import "builder-settings-types/dist/style.css";
import {
  SettingGroup,
  ColorSetting,
  WidthSetting,
  BorderSettingSet,
  OpacitySetting,
  SelectApiSettings,
} from "builder-settings-types";

export interface SettingsObject {
  draw: () => HTMLElement;
  setOnChange?: (callback: (values: Record<string, unknown>) => void) => void;
  setValue?: (values: Record<string, unknown>) => void;
  getValues?: () => Record<string, unknown>;
  title?: string;
}

const BUILDER_SETTINGS_TYPES = {
  SettingGroup,
  ColorSetting,
  WidthSetting,
  BorderSettingSet,
  OpacitySetting,
  SelectApiSettings,
} as const;

class SettingsCache {
  private cache = new Map<string, SettingsObject | null>();

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
  ): SettingsObject | null | undefined {
    const key = this.generateCacheKey(componentName, content);
    return this.cache.get(key);
  }

  set(
    componentName: string,
    content: string,
    settingsObject: SettingsObject | null
  ): void {
    const key = this.generateCacheKey(componentName, content);
    this.cache.set(key, settingsObject);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

const settingsCache = new SettingsCache();

function createMockRequire(): (moduleName: string) => unknown {
  return (moduleName: string): unknown => {
    if (moduleName === "builder-settings-types") {
      return BUILDER_SETTINGS_TYPES;
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
      const {
        SettingGroup,
        ColorSetting,
        WidthSetting,
        BorderSettingSet,
        SelectApiSettings,
        OpacitySetting
      } = require('builder-settings-types');
      
      ${tsContent}
      
      return module.exports;
    `
  ) as (exports: unknown, require: (moduleName: string) => unknown) => unknown;
}

function extractSettingsObject(moduleExports: unknown): SettingsObject | null {
  if (moduleExports && typeof moduleExports === "object") {
    const defaultExport = (moduleExports as Record<string, unknown>).default;
    if (
      defaultExport &&
      typeof defaultExport === "object" &&
      "draw" in defaultExport
    ) {
      return defaultExport as SettingsObject;
    }
  }

  if (moduleExports && typeof moduleExports === "object") {
    const settingsObject = Object.values(
      moduleExports as Record<string, unknown>
    ).find(
      (exp: unknown) =>
        exp && typeof exp === "object" && "draw" in (exp as object)
    );

    if (settingsObject) {
      return settingsObject as SettingsObject;
    }
  }

  return null;
}

export function compileSettingsObject(
  tsContent: string
): SettingsObject | null {
  if (!tsContent?.trim()) {
    return null;
  }

  try {
    const moduleContext = createModuleContext(tsContent);
    const mockRequire = createMockRequire();
    const moduleExports = moduleContext({}, mockRequire);

    return extractSettingsObject(moduleExports);
  } catch (error) {
    console.warn("Failed to compile settings object:", {
      error: error instanceof Error ? error.message : String(error),
      contentPreview: tsContent.substring(0, 100) + "...",
    });
    return null;
  }
}

export function getCompiledSettings(
  componentName: string,
  settingsContent?: string
): SettingsObject | null {
  if (!settingsContent?.trim() || !componentName) {
    return null;
  }

  const cached = settingsCache.get(componentName, settingsContent);
  if (cached !== undefined) {
    return cached;
  }

  const compiled = compileSettingsObject(settingsContent);
  settingsCache.set(componentName, settingsContent, compiled);

  return compiled;
}

export function clearSettingsCache(): void {
  settingsCache.clear();
}

export function getSettingsCacheStats(): { size: number } {
  return {
    size: settingsCache.size,
  };
}
