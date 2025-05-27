import { cache } from "react";
import { fetchComponents, type ContentFile } from "../api/action";
import {
  EnhancedReaderService,
  type FileData,
} from "@app-shared/services/reader";
import type { ComponentFileData, ComponentFetchResult } from "../types";
import { StylesRenderer } from "../../property-adjustments/services/styles-render";

export const DEFAULT_SCRIPT_PATTERNS = [
  "index.tsx",
  "index.ts",
  "index.jsx",
  "index.js",
] as const;

export const MAX_RETRY_COUNT = 3;

const componentCacheInvalidation = new Map<string, number>();
let globalCacheVersion = 0;

export function invalidateComponentCache(componentId: string): void {
  componentCacheInvalidation.set(componentId, Date.now());
  globalCacheVersion++;
}

export function clearAllComponentCache(): void {
  componentCacheInvalidation.clear();
  globalCacheVersion++;
}

function getCacheVersion(componentId: string): string {
  const specificVersion = componentCacheInvalidation.get(componentId) || 0;
  return `${globalCacheVersion}-${specificVersion}`;
}

export const loadComponentData = cache(
  async (
    componentName: string,
    componentId: string,
    cacheVersion: string
  ): Promise<ComponentFileData[]> => {
    void cacheVersion;
    const files: ContentFile[] = await fetchComponents(
      componentName,
      componentId
    );

    if (!files || files.length === 0) {
      console.error(`[LOADER] No files found for component: ${componentName}`);
      throw new Error(`No files found for component: ${componentName}`);
    }

    const result = files.map((file) => ({
      file: file.file,
      type: file.type as "script" | "style",
      content: file.content,
      prefix: file.prefix,
    }));

    return result;
  }
);

export const compileComponent = cache(
  async (
    componentName: string,
    fileData: ComponentFileData[],
    cacheVersion: string,
    componentProps?: Record<string, unknown>,
    componentStyles?: Record<string, string>
  ): Promise<ComponentFetchResult> => {
    void cacheVersion;
    const reader = new EnhancedReaderService(fileData as FileData[]);

    const stylesArr = reader.getAllStyles();
    let styles = stylesArr.map((s) => s.content).join("\n");

    const { script, usedPattern } = getScriptContent(reader, componentName);

    if (!script) {
      throw new Error(
        `No script file found for ${componentName}. Available files: ${fileData.map((f) => f.file).join(", ")}`
      );
    }

    const component = reader.getReactComponentFromString(
      script,
      usedPattern || componentName
    );

    if (!component) {
      throw new Error(
        `Failed to evaluate component from ${usedPattern || "script"} for ${componentName}`
      );
    }

    const prefix =
      fileData.find((f) => f.type === "style")?.prefix ||
      `${componentName}_fallback`;

    const settingsCSS = generateSettingsCSS(
      componentProps,
      componentStyles,
      prefix
    );
    if (settingsCSS) {
      styles += `\n\n/* Settings-based CSS */\n${settingsCSS}`;
    }

    return {
      component,
      styles,
      prefix,
      compiledData: {
        files: fileData,
        settingsObject: undefined,
      },
    };
  }
);

function getScriptContent(
  reader: EnhancedReaderService,
  componentName: string
): { script: string; usedPattern: string } {
  const patterns = [
    ...DEFAULT_SCRIPT_PATTERNS,
    `${componentName}.tsx`,
    `${componentName}.ts`,
  ];

  for (const pattern of patterns) {
    const script = reader.getScriptContent(pattern);
    if (script) {
      return { script, usedPattern: pattern };
    }
  }

  const allScripts = reader.getAllScripts();
  if (allScripts.length > 0) {
    return {
      script: allScripts[0].content,
      usedPattern: allScripts[0].file,
    };
  }

  throw new Error(`No script file found for ${componentName}`);
}

const loadComponentCached = cache(
  async (
    componentName: string,
    componentId: string,
    cacheVersion: string,
    componentProps?: Record<string, unknown>,
    componentStyles?: Record<string, string>
  ): Promise<ComponentFetchResult> => {
    void cacheVersion;
    const fileData = await loadComponentData(
      componentName,
      componentId,
      cacheVersion
    );
    const result = await compileComponent(
      componentName,
      fileData,
      cacheVersion,
      componentProps,
      componentStyles
    );

    return result;
  }
);

export async function loadComponent(
  componentName: string,
  componentId: string,
  componentProps?: Record<string, unknown>,
  componentStyles?: Record<string, string>
): Promise<ComponentFetchResult> {
  const cacheVersion = getCacheVersion(componentId);

  return loadComponentCached(
    componentName,
    componentId,
    cacheVersion,
    componentProps,
    componentStyles
  );
}

function generateSettingsCSS(
  componentProps: Record<string, unknown> = {},
  componentStyles: Record<string, string> = {},
  prefix: string
): string {
  return StylesRenderer.generateCSS(componentProps, componentStyles, prefix);
}
