import type { ComponentType } from "react";

export interface FileData {
  file: string;
  type: "script" | "style";
  content: string;
  prefix: string;
}

export interface ModuleExports {
  default?: ComponentType<unknown> | object;
  [key: string]: ComponentType<unknown> | object | undefined;
}
export interface CustomModule {
  exports: ModuleExports;
}
