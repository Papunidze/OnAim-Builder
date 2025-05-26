import ActualReact from "react";
import type { ReactElement, ComponentType } from "react";
import type { CustomModule, FileData } from "./reader.interface";

export class ReaderServiceError extends Error {
  constructor(
    message: string,
    public readonly fileName: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "ReaderServiceError";
  }
}

interface CacheEntry {
  component: ComponentType<unknown> | null;
  timestamp: number;
}

export class EnhancedReaderService {
  private componentCache = new Map<string, CacheEntry>();
  private readonly cacheTimeout = 5 * 60 * 1000;

  constructor(private readonly fileData: FileData[]) {
    this.validateFileData();
  }

  private validateFileData(): void {
    if (!Array.isArray(this.fileData)) {
      throw new ReaderServiceError(
        "FileData must be an array",
        "constructor",
        "validation"
      );
    }

    for (const file of this.fileData) {
      if (!file.file || !file.type || !file.content) {
        throw new ReaderServiceError(
          "Invalid file data structure",
          file.file || "unknown",
          "validation"
        );
      }
    }
  }

  private findFile(
    fileName: string,
    type: "script" | "style"
  ): FileData | undefined {
    return this.fileData.find((f) => f.file === fileName && f.type === type);
  }
  private findFileByPattern(
    pattern: string,
    type: "script" | "style"
  ): FileData | undefined {
    let file = this.findFile(pattern, type);
    if (file) return file;

    const extensions =
      type === "script" ? [".tsx", ".ts", ".jsx", ".js"] : [".css", ".scss"];

    for (const ext of extensions) {
      file = this.findFile(`${pattern}${ext}`, type);
      if (file) return file;
    }

    const patternWithoutExt = pattern.replace(/\.[^/.]+$/, "");
    for (const ext of extensions) {
      file = this.findFile(`${patternWithoutExt}${ext}`, type);
      if (file) return file;
    }

    const fuzzyMatch = this.fileData.find(
      (f) =>
        f.type === type &&
        (f.file.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(f.file.toLowerCase()) ||
          f.file.replace(/\.[^/.]+$/, "") === patternWithoutExt)
    );

    return fuzzyMatch;
  }

  getScriptContent(fileName: string): string | undefined {
    const file = this.findFileByPattern(fileName, "script");
    return file?.content;
  }

  getStyleContent(fileName: string): string | undefined {
    const file = this.findFileByPattern(fileName, "style");
    return file?.content;
  }

  getAllScripts(): FileData[] {
    return this.fileData.filter((f) => f.type === "script");
  }

  getAllStyles(): FileData[] {
    return this.fileData.filter((f) => f.type === "style");
  }

  getFilesByPrefix(prefix: string): FileData[] {
    return this.fileData.filter((f) => f.prefix === prefix);
  }

  private isReactComponent(
    component: unknown
  ): component is ComponentType<unknown> {
    if (!component || typeof component !== "function") {
      return false;
    }

    const componentStr = component.toString();

    if (
      componentStr.includes("React.createElement") ||
      componentStr.includes("jsx") ||
      (componentStr.includes("return") &&
        (componentStr.includes("<") ||
          componentStr.includes("React.") ||
          componentStr.includes("createElement")))
    ) {
      return true;
    }

    if (
      componentStr.includes("Component") ||
      componentStr.includes("render") ||
      componentStr.includes("extends")
    ) {
      return true;
    }

    return false;
  }

  private createSafeRequire(
    fileNameForDebug: string
  ): (moduleName: string) => ComponentType<unknown> | object {
    const moduleCache = new Map<string, ComponentType<unknown> | object>();

    return (moduleName: string): ComponentType<unknown> | object => {
      if (moduleCache.has(moduleName)) {
        return moduleCache.get(moduleName)!;
      }
      if (moduleName === "react") {
        moduleCache.set(moduleName, ActualReact);
        return ActualReact;
      }

      if (moduleName === "react/jsx-runtime") {
        const jsxRuntime = {
          jsx: ActualReact.createElement,
          jsxs: ActualReact.createElement,
        };
        moduleCache.set(moduleName, jsxRuntime);
        return jsxRuntime;
      }

      const match = this.findFileByPattern(moduleName, "script");

      let alternateMatch: FileData | undefined;
      if (!match) {
        const patterns = [
          moduleName.replace(/^\.\//, ""),
          moduleName.replace(/^\.\.\//, ""),
          `${moduleName}.tsx`,
          `${moduleName}.ts`,
          `${moduleName}.jsx`,
          `${moduleName}.js`,
        ];

        for (const pattern of patterns) {
          alternateMatch = this.findFileByPattern(pattern, "script");
          if (alternateMatch) break;
        }
      }
      const resolvedMatch = match || alternateMatch;

      if (!resolvedMatch?.content) {
        const emptyModule = {};
        moduleCache.set(moduleName, emptyModule);
        return emptyModule;
      }

      try {
        const mod: CustomModule = { exports: {} };
        const depFn = new Function(
          "module",
          "exports",
          "require",
          "React",
          resolvedMatch.content
        );

        depFn(
          mod,
          mod.exports,
          this.createSafeRequire(resolvedMatch.file),
          ActualReact
        );

        const result = mod.exports.default ?? mod.exports;
        moduleCache.set(moduleName, result);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(
          `[EnhancedReaderService - ${fileNameForDebug}] Error loading module "${moduleName}":`,
          errorMsg
        );

        const emptyModule = {};
        moduleCache.set(moduleName, emptyModule);
        return emptyModule;
      }
    };
  }

  getReactComponentFromString(
    jsCode: string,
    fileNameForDebug: string
  ): ComponentType<unknown> | null {
    const cacheKey = `${fileNameForDebug}:${jsCode.substring(0, 100)}`;
    const cached = this.componentCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.component;
    }

    try {
      if (!jsCode || typeof jsCode !== "string") {
        throw new ReaderServiceError(
          "Invalid JavaScript code provided",
          fileNameForDebug,
          "getReactComponentFromString"
        );
      }

      const mod: CustomModule = { exports: {} };

      const fn = new Function(
        "module",
        "exports",
        "require",
        "React",
        "console",
        jsCode
      );

      fn(
        mod,
        mod.exports,
        this.createSafeRequire(fileNameForDebug),
        ActualReact,
        {
          log: (...args: unknown[]) =>
            console.warn(`[${fileNameForDebug}]`, ...args),
          warn: (...args: unknown[]) =>
            console.warn(`[${fileNameForDebug}]`, ...args),
          error: (...args: unknown[]) =>
            console.error(`[${fileNameForDebug}]`, ...args),
        }
      );

      const exported = mod.exports.default ?? mod.exports;
      const component = this.isReactComponent(exported) ? exported : null;

      this.componentCache.set(cacheKey, {
        component,
        timestamp: Date.now(),
      });

      return component;
    } catch (error) {
      const readerError = new ReaderServiceError(
        `Error parsing component: ${error instanceof Error ? error.message : String(error)}`,
        fileNameForDebug,
        "getReactComponentFromString",
        error instanceof Error ? error : undefined
      );

      console.error(
        `[EnhancedReaderService - ${fileNameForDebug}] ${readerError.message}`,
        "\nStack:",
        error instanceof Error ? error.stack : "No stack trace",
        "\nCode snippet:",
        jsCode.slice(0, 200) + "..."
      );

      this.componentCache.set(cacheKey, {
        component: null,
        timestamp: Date.now(),
      });

      return null;
    }
  }

  clearCache(): void {
    this.componentCache.clear();
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.componentCache.size,
      entries: Array.from(this.componentCache.keys()),
    };
  }

  getFilesSummary(): {
    scripts: string[];
    styles: string[];
    prefixes: string[];
  } {
    const scripts = this.getAllScripts().map((f) => f.file);
    const styles = this.getAllStyles().map((f) => f.file);
    const prefixes = [...new Set(this.fileData.map((f) => f.prefix))];

    return { scripts, styles, prefixes };
  }

  validateComponent(component: ComponentType<unknown>): boolean {
    try {
      const element = ActualReact.createElement(component, {});
      return element != null;
    } catch {
      return false;
    }
  }

  getMultipleComponents(
    jsCodeArray: { code: string; fileName: string }[]
  ): (ComponentType<unknown> | null)[] {
    return jsCodeArray.map(({ code, fileName }) =>
      this.getReactComponentFromString(code, fileName)
    );
  }
}

export class ReaderService {
  constructor(private readonly fileData: FileData[]) {}

  private findFile(
    fileName: string,
    type: "script" | "style"
  ): FileData | undefined {
    return this.fileData.find((f) => f.file === fileName && f.type === type);
  }

  getScriptContent(fileName: string): string | undefined {
    return this.findFile(fileName, "script")?.content;
  }

  getStyleContent(fileName: string): string | undefined {
    return this.findFile(fileName, "style")?.content;
  }

  getAllScripts(): FileData[] {
    return this.fileData.filter((f) => f.type === "script");
  }

  getAllStyles(): FileData[] {
    return this.fileData.filter((f) => f.type === "style");
  }

  private isReactComponent(
    component: unknown
  ): component is ComponentType<unknown> {
    if (typeof component === "function") return true;

    if (
      typeof component === "object" &&
      component !== null &&
      ("$$typeof" in component || "render" in component)
    ) {
      const comp = component as {
        $$typeof?: symbol;
        render?: () => ReactElement;
      };

      return (
        typeof comp.render === "function" ||
        comp.$$typeof === Symbol.for("react.forward_ref") ||
        comp.$$typeof === Symbol.for("react.memo")
      );
    }

    return false;
  }

  private customRequire(
    fileNameForDebug: string
  ): (moduleName: string) => ComponentType<unknown> | object {
    return (moduleName: string): ComponentType<unknown> | object => {
      if (moduleName === "react") return ActualReact;

      const match = this.fileData.find(
        (f) =>
          f.type === "script" &&
          (f.file === moduleName ||
            f.file === `${moduleName}.js` ||
            f.file === `${moduleName}.ts` ||
            f.file === `${moduleName}.tsx`)
      );

      if (!match?.content) {
        console.warn(
          `[ReaderService - ${fileNameForDebug}] Could not resolve module: "${moduleName}".`
        );
        return {};
      }

      const mod: CustomModule = { exports: {} };
      const depFn = new Function(
        "module",
        "exports",
        "require",
        "React",
        match.content
      );
      depFn(
        mod,
        mod.exports,
        this.customRequire(fileNameForDebug),
        ActualReact
      );

      return mod.exports.default ?? mod.exports;
    };
  }

  getReactComponentFromString(
    jsCode: string,
    fileNameForDebug: string
  ): ComponentType<unknown> | null {
    try {
      const mod: CustomModule = { exports: {} };
      const fn = new Function("module", "exports", "require", "React", jsCode);
      fn(mod, mod.exports, this.customRequire(fileNameForDebug), ActualReact);

      const exported = mod.exports.default ?? mod.exports;

      return this.isReactComponent(exported) ? exported : null;
    } catch (error) {
      const err = error as Error;
      console.error(
        `[ReaderService - ${fileNameForDebug}] Error parsing component string:`,
        err.message,
        err.stack,
        "\nCode snapshot:",
        jsCode.slice(0, 500) + "..."
      );
      return null;
    }
  }
}
