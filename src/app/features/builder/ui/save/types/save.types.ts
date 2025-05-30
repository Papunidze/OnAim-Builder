export interface SaveProps {
  viewMode: "desktop" | "mobile";
}

export interface ComponentExportData {
  component: {
    id: string;
    name: string;
    prefix: string;
  };
  layout: {
    position: {
      grid: {
        row: number;
        column: number;
      };
      coordinates: { x: number; y: number };
    };
    size?: { width: number; height: number };
  };
  configuration: {
    settings: Record<string, unknown>;
    props: Record<string, unknown>;
    styles: Record<string, unknown>;
    elementSpecificCSS: string;
  };
}

export interface SaveData {
  project: {
    metadata: {
      version: string;
      format: string;
      viewMode: string;
      exportTimestamp: string;
      lastModified: string;
      projectName: string;
      generator: string;
    };
    statistics: {
      components: {
        total: number;
        uniqueTypes: number;
        breakdown: { name: string; count: number }[];
      };
    };
  };
  components: ComponentExportData[];
}

export interface SourceFiles {
  [path: string]: string;
}

export interface BuildManifest {
  projectName: string;
  viewMode: string;
  exportTimestamp: string;
  components: {
    name: string;
    id: string;
    folder: string;
  }[];
}

export type ExportFormat = "json" | "source" | "build";

export interface ExportOptions {
  format: ExportFormat;
  viewMode: "desktop" | "mobile";
  projectName?: string;
  timestamp?: string;
}
