import type { ComponentState } from "react";
import type {
  BuilderServiceEvents,
  BuilderState,
  EventCallback,
} from "./buiilder.interfaces";

export class BuilderService {
  private state: BuilderState = {
    desktop: [],
    mobile: [],
    metadata: {
      version: "1.0.0",
      lastModified: Date.now(),
    },
    selectedComponentId: undefined,
  };

  private subscribers: (() => void)[] = [];
  private eventListeners = new Map<
    keyof BuilderServiceEvents,
    EventCallback<unknown>[]
  >();
  private undoStack: BuilderState[] = [];
  private redoStack: BuilderState[] = [];
  private readonly MAX_HISTORY = 50;

  constructor() {}

  on<K extends keyof BuilderServiceEvents>(
    event: K,
    callback: EventCallback<BuilderServiceEvents[K]>
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.push(callback as EventCallback<unknown>);

    return () => {
      const index = listeners.indexOf(callback as EventCallback<unknown>);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
  private emit<K extends keyof BuilderServiceEvents>(
    event: K,
    data: BuilderServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(data));
  }

  private saveHistory(): void {
    this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  private generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateMetadata(): void {
    this.state.metadata.lastModified = Date.now();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.unsubscribe(callback);
    };
  }

  private unsubscribe(callback: () => void): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((sub) => sub());
    this.updateMetadata();
  }

  addComponent(
    name: string,
    viewMode: "desktop" | "mobile",
    options?: {
      props?: Record<string, unknown>;
      styles?: Record<string, string>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }
  ): ComponentState {
    this.saveHistory();

    const component: ComponentState = {
      id: this.generateId(),
      name,
      viewMode,
      props: options?.props || {},
      styles: options?.styles || {},
      position: options?.position,
      size: options?.size,
      timestamp: Date.now(),
    };

    this.state[viewMode].push(component);
    this.emit("componentAdded", component);
    this.notifySubscribers();

    return component;
  }

  removeComponent(name: string, viewMode: "desktop" | "mobile"): boolean;
  removeComponent(id: string): boolean;
  removeComponent(
    identifier: string,
    viewMode?: "desktop" | "mobile"
  ): boolean {
    this.saveHistory();

    let removed = false;
    let removedComponent: ComponentState | undefined;

    if (viewMode) {
      const viewComponents = this.state[viewMode];
      const index = viewComponents.findIndex(
        (comp) => comp.name === identifier
      );
      if (index > -1) {
        removedComponent = viewComponents[index];
        viewComponents.splice(index, 1);
        removed = true;
      }
    } else {
      for (const mode of ["desktop", "mobile"] as const) {
        const viewComponents = this.state[mode];
        const index = viewComponents.findIndex(
          (comp) => comp.id === identifier
        );
        if (index > -1) {
          removedComponent = viewComponents[index];
          viewComponents.splice(index, 1);
          removed = true;
          break;
        }
      }
    }

    if (removed && removedComponent) {
      this.emit("componentRemoved", removedComponent);
      this.notifySubscribers();
    }

    return removed;
  }

  updateComponent(id: string, updates: Partial<ComponentState>): boolean {
    this.saveHistory();

    for (const mode of ["desktop", "mobile"] as const) {
      const component = this.state[mode].find((comp) => comp.id === id);
      if (component) {
        const updatedComponent = { ...component, ...updates, id };
        Object.assign(component, updatedComponent);
        this.emit("componentUpdated", component);
        this.notifySubscribers();
        return true;
      }
    }

    return false;
  }

  getComponent(id: string): ComponentState | undefined {
    for (const mode of ["desktop", "mobile"] as const) {
      const component = this.state[mode].find((comp) => comp.id === id);
      if (component) return component;
    }
    return undefined;
  }

  hasComponent(name: string, viewMode: "desktop" | "mobile"): boolean {
    return this.state[viewMode].some((comp) => comp.name === name);
  }

  getComponents(viewMode: "desktop" | "mobile"): ComponentState[] {
    return [...this.state[viewMode]];
  }

  getComponentNames(viewMode: "desktop" | "mobile"): string[] {
    return this.state[viewMode].map((comp) => comp.name);
  }

  getState(): BuilderState {
    return JSON.parse(JSON.stringify(this.state));
  }

  setState(newState: Partial<BuilderState>): void {
    this.saveHistory();
    this.state = { ...this.state, ...newState };
    this.emit("stateLoaded", this.state);
    this.notifySubscribers();
  }

  clear(): void {
    this.saveHistory();
    this.state = {
      desktop: [],
      mobile: [],
      metadata: {
        version: "1.0.0",
        lastModified: Date.now(),
      },
      selectedComponentId: undefined,
    };
    this.emit("stateCleared", undefined);
    this.notifySubscribers();
  }

  selectComponent(componentId: string | null): void {
    const prevSelectedId = this.state.selectedComponentId;

    if (prevSelectedId === componentId) {
      return; // No change
    }

    this.state.selectedComponentId = componentId || undefined;

    const selectedComponent = componentId
      ? this.getComponent(componentId)
      : null;
    this.emit("componentSelected", selectedComponent);
    this.notifySubscribers();
  }

  getSelectedComponent(): ComponentState | null {
    if (!this.state.selectedComponentId) {
      return null;
    }
    return this.getComponent(this.state.selectedComponentId) || null;
  }

  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importState(stateJson: string): boolean {
    try {
      const newState = JSON.parse(stateJson) as BuilderState;
      this.setState(newState);
      return true;
    } catch (error) {
      console.error("Failed to import state:", error);
      return false;
    }
  }

  findComponents(
    predicate: (component: ComponentState) => boolean
  ): ComponentState[] {
    const results: ComponentState[] = [];
    for (const mode of ["desktop", "mobile"] as const) {
      results.push(...this.state[mode].filter(predicate));
    }
    return results;
  }

  findComponentsByName(name: string): ComponentState[] {
    return this.findComponents((comp) => comp.name === name);
  }

  getStats(): {
    totalComponents: number;
    desktopComponents: number;
    mobileComponents: number;
    uniqueComponentNames: number;
    lastModified: number;
  } {
    const desktopComponents = this.state.desktop.length;
    const mobileComponents = this.state.mobile.length;
    const allNames = [
      ...this.state.desktop.map((c) => c.name),
      ...this.state.mobile.map((c) => c.name),
    ];
    const uniqueComponentNames = new Set(allNames).size;

    return {
      totalComponents: desktopComponents + mobileComponents,
      desktopComponents,
      mobileComponents,
      uniqueComponentNames,
      lastModified: this.state.metadata.lastModified,
    };
  }
  setProjectName(name: string): void {
    this.state.metadata.projectName = name;
    this.notifySubscribers();
  }

  getProjectName(): string | undefined {
    return this.state.metadata.projectName;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): boolean {
    if (this.undoStack.length === 0) {
      return false;
    }

    const previousState = this.undoStack.pop()!;
    this.redoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.state = previousState;
    this.notifySubscribers();
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false;
    }

    const nextState = this.redoStack.pop()!;
    this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.state = nextState;
    this.notifySubscribers();
    return true;
  }
}

export const builderService = new BuilderService();
