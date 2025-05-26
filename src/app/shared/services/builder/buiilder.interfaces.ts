export interface ComponentState {
  id: string;
  name: string;
  viewMode: "desktop" | "mobile";
  props?: Record<string, unknown>;
  styles?: Record<string, string>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  timestamp: number;
}

export interface BuilderState {
  desktop: ComponentState[];
  mobile: ComponentState[];
  metadata: {
    version: string;
    lastModified: number;
    projectName?: string;
  };
}

export interface BuilderServiceEvents {
  componentAdded: ComponentState;
  componentRemoved: ComponentState;
  componentUpdated: ComponentState;
  stateCleared: void;
  stateLoaded: BuilderState;
}

export type EventCallback<T> = (data: T) => void;
