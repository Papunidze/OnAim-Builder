import type { ComponentState } from "@app-shared/services/builder";

export type ViewMode = "desktop" | "mobile";

export type ComponentStatus = "idle" | "loading" | "loaded" | "error";

export interface ComponentInstanceState {
  id: string;
  name: string;
  status: ComponentStatus;
  component?: React.ComponentType<unknown> | null;
  styles?: string;
  error?: string;
  retryCount?: number;
  prefix?: string;
}

export interface ContentRendererProps {
  components: ComponentState[];
  viewMode: ViewMode;
  useDragAndDrop?: boolean;
  onLayoutChange?: (layouts: import('react-grid-layout').Layouts) => void;
  savedLayouts?: import('react-grid-layout').Layouts;
}

export interface ComponentFileData {
  file: string;
  type: "script" | "style";
  content: string;
  prefix: string;
}

export interface ComponentFetchResult {
  component: React.ComponentType<unknown> | null;
  styles: string;
  prefix: string;
  compiledData?: {
    files: ComponentFileData[];
    settingsObject?: {
      draw: () => HTMLElement;
      setOnChange?: (
        callback: (values: Record<string, unknown>) => void
      ) => void;
      setValue?: (values: Record<string, unknown>) => void;
      title?: string;
    };
  };
}

export interface UseComponentInstancesOptions {
  maxRetryCount?: number;
  scriptPatterns?: string[];
}

export interface ComponentRenderProps {
  instance: ComponentInstanceState;
  onRetry: (instanceId: string) => void;
}

export type ComponentPromise = Promise<ComponentFetchResult>;
export type ComponentsPromise = Promise<ComponentInstanceState[]>;
