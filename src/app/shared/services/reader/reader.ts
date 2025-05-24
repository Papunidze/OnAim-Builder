import ActualReact from "react";

export interface FileData {
  file: string;
  type: "script" | "style";
  content: string;
  prefix: string;
}

export class ReaderService {
  constructor(private fileData: FileData[]) {}

  public getScriptContent(fileName: string): string | undefined {
    const file = this.fileData.find(
      (f: FileData) => f.file === fileName && f.type === "script"
    );
    return file?.content;
  }

  public getStyleContent(fileName: string): string | undefined {
    const file = this.fileData.find(
      (f: FileData) => f.file === fileName && f.type === "style"
    );
    return file?.content;
  }

  public getAllScripts(): FileData[] {
    return this.fileData.filter((f: FileData) => f.type === "script");
  }

  public getAllStyles(): FileData[] {
    return this.fileData.filter((f: FileData) => f.type === "style");
  }

  public getReactComponentFromString(
    jsCode: string,
    fileNameForDebug: string
  ): React.ComponentType<unknown> | null {
    try {
      interface ModuleExports {
        default?: unknown;
        [key: string]: unknown;
      }
      const m: { exports: ModuleExports } = { exports: {} };

      const customRequire = (moduleName: string): unknown => {
        if (moduleName === "react") {
          return ActualReact;
        }

        const dependencyFile = this.fileData.find(
          (f: FileData) =>
            (f.file === moduleName ||
              f.file === `${moduleName}.js` ||
              f.file === `${moduleName}.ts` ||
              f.file === `${moduleName}.tsx`) &&
            f.type === "script"
        );

        if (dependencyFile?.content) {
          const nestedM: { exports: ModuleExports } = { exports: {} };
          const dependencyModuleContent = dependencyFile.content;
          const depFunc = new Function(
            "module",
            "exports",
            "require",
            "React",
            dependencyModuleContent
          );
          depFunc(nestedM, nestedM.exports, customRequire, ActualReact);
          return nestedM.exports.default !== undefined
            ? nestedM.exports.default
            : nestedM.exports;
        }

        console.warn(
          `[ReaderService - ${fileNameForDebug}] Attempted to require unresolved module: ${moduleName}. Returning empty object.`
        );
        return {};
      };

      const componentFunction = new Function(
        "module",
        "exports",
        "require",
        "React",
        jsCode
      );
      componentFunction(m, m.exports, customRequire, ActualReact);

      const component =
        m.exports.default !== undefined ? m.exports.default : m.exports;

      if (
        component &&
        (typeof component === "function" ||
          (typeof component === "object" &&
            component !== null &&
            ((component as { $$typeof?: symbol }).$$typeof ===
              Symbol.for("react.forward_ref") ||
              (component as { $$typeof?: symbol }).$$typeof ===
                Symbol.for("react.element") ||
              (component as { $$typeof?: symbol }).$$typeof ===
                Symbol.for("react.memo"))))
      ) {
        return component as React.ComponentType<unknown>;
      } else if (
        component &&
        typeof component === "object" &&
        component !== null &&
        typeof (component as { render?: (...args: unknown[]) => unknown })
          .render === "function"
      ) {
        return component as React.ComponentType<unknown>;
      } else {
        console.error(
          `[ReaderService - ${fileNameForDebug}] Evaluated code did not export a recognizable React component. Exports:`,
          m.exports
        );
        return null;
      }
    } catch (error: unknown) {
      console.error(
        `[ReaderService - ${fileNameForDebug}] Error evaluating component string:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
        "\nCode snapshot:",
        jsCode.substring(0, 500) + "..."
      );
      return null;
    }
  }
}
