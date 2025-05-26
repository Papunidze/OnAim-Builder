export interface ComponentState {
  id: string;
  name: string;
  viewMode: "desktop" | "mobile";
  props?: Record<string, unknown>;
  styles?: Record<string, string>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  timestamp: number;
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
  // Add compiled component data to avoid redundant API calls
  compiledData?: {
    files: {
      file: string;
      type: "script" | "style";
      content: string;
      prefix: string;
    }[];
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
