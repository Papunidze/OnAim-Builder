import ActualReact from "react";
import type { ReactElement, ComponentType } from "react";

export interface FileData {
  file: string;
  type: "script" | "style";
  content: string;
  prefix: string;
}

interface ModuleExports {
  default?: ComponentType<unknown> | object;
  [key: string]: ComponentType<unknown> | object | undefined;
}

interface CustomModule {
  exports: ModuleExports;
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
