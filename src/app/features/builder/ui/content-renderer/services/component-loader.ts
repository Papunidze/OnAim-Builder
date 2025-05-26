import { cache } from "react";
import { fetchComponents, type ContentFile } from "../api/action";
import {
  EnhancedReaderService,
  type FileData,
} from "@app-shared/services/reader";
import type { ComponentFileData, ComponentFetchResult } from "../types";

export const DEFAULT_SCRIPT_PATTERNS = [
  "index.tsx",
  "index.ts",
  "index.jsx",
  "index.js",
] as const;

export const MAX_RETRY_COUNT = 3;

export const loadComponentData = cache(
  async (
    componentName: string,
    componentId: string
  ): Promise<ComponentFileData[]> => {
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
    fileData: ComponentFileData[]
  ): Promise<ComponentFetchResult> => {
    const reader = new EnhancedReaderService(fileData as FileData[]);

    const stylesArr = reader.getAllStyles();
    const styles = stylesArr.map((s) => s.content).join("\n");

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

export const loadComponent = cache(
  async (
    componentName: string,
    componentId: string
  ): Promise<ComponentFetchResult> => {
    const fileData = await loadComponentData(componentName, componentId);
    const result = await compileComponent(componentName, fileData);

    return result;
  }
);
