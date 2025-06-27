export interface ComponentState {
  id: string;
  name: string;
  viewMode: "desktop" | "mobile";
  props: Record<string, unknown>;
  styles: Record<string, string>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  // Grid layout information for undo/redo functionality
  gridLayout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  timestamp: number;
  component?: React.ComponentType<unknown>;
  compiledData?: {
    files: {
      file: string;
      type: string;
      content: string;
      prefix?: string;
    }[];
    settingsObject?: unknown;
  };
  status?: "idle" | "loading" | "loaded" | "error";
  error?: string;
  retryCount?: number;
  settings?: {
    title: string;
    settings: Record<
      string,
      {
        defaultValue: unknown;
        title: string;
        type?: string;
      }
    >;
  };
}

export interface BuilderState {
  desktop: ComponentState[];
  mobile: ComponentState[];
  metadata: {
    version: string;
    lastModified: number;
    projectName?: string;
  };
  selectedComponentId?: string;
}

export interface BuilderServiceEvents {
  componentAdded: ComponentState;
  componentRemoved: ComponentState;
  componentUpdated: ComponentState;
  componentSelected: ComponentState | null;
  stateCleared: void;
  stateLoaded: BuilderState;
}

export type EventCallback<T> = (data: T) => void;
