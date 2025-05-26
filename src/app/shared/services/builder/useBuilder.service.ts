import { useState, useEffect, useCallback, type ComponentState } from "react";
import { builderService } from "./builder.service";
import type { BuilderState } from "./buiilder.interfaces";

export interface UseBuilderReturn {
  components: BuilderState;
  stats: {
    totalComponents: number;
    desktopComponents: number;
    mobileComponents: number;
    uniqueComponentNames: number;
    lastModified: number;
  };

  addComponent: (
    name: string,
    viewMode: "desktop" | "mobile",
    options?: {
      props?: Record<string, unknown>;
      styles?: Record<string, string>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }
  ) => ComponentState;
  removeComponent: (name: string, viewMode: "desktop" | "mobile") => boolean;
  removeComponentById: (id: string) => boolean;
  updateComponent: (id: string, updates: Partial<ComponentState>) => boolean;
  getComponent: (id: string) => ComponentState | undefined;

  hasComponent: (name: string, viewMode: "desktop" | "mobile") => boolean;
  getComponents: (viewMode: "desktop" | "mobile") => ComponentState[];
  getComponentNames: (viewMode: "desktop" | "mobile") => string[];
  findComponents: (
    predicate: (component: ComponentState) => boolean
  ) => ComponentState[];
  findComponentsByName: (name: string) => ComponentState[];

  clear: () => void;
  exportState: () => string;
  importState: (stateJson: string) => boolean;

  canUndo: boolean;
  canRedo: boolean;
  undo: () => boolean;
  redo: () => boolean;

  projectName?: string;
  setProjectName: (name: string) => void;

  // Component selection methods
  selectComponent: (componentId: string | null) => void;
  getSelectedComponent: () => ComponentState | null;
  selectedComponentId?: string;
}

export function useBuilder(): UseBuilderReturn {
  const [components, setComponents] = useState<BuilderState>(() =>
    builderService.getState()
  );

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const unsubscribe = builderService.subscribe(() => {
      setComponents(builderService.getState());
      setCanUndo(builderService.canUndo());
      setCanRedo(builderService.canRedo());
    });

    setCanUndo(builderService.canUndo());
    setCanRedo(builderService.canRedo());

    return unsubscribe;
  }, []);

  const addComponent = useCallback(
    (
      name: string,
      viewMode: "desktop" | "mobile",
      options?: {
        props?: Record<string, unknown>;
        styles?: Record<string, string>;
        position?: { x: number; y: number };
        size?: { width: number; height: number };
      }
    ) => {
      return builderService.addComponent(name, viewMode, options);
    },
    []
  );

  const removeComponent = useCallback(
    (name: string, viewMode: "desktop" | "mobile") => {
      return builderService.removeComponent(name, viewMode);
    },
    []
  );

  const removeComponentById = useCallback((id: string) => {
    return builderService.removeComponent(id);
  }, []);

  const updateComponent = useCallback(
    (id: string, updates: Partial<ComponentState>) => {
      return builderService.updateComponent(id, updates);
    },
    []
  );

  const getComponent = useCallback((id: string) => {
    return builderService.getComponent(id);
  }, []);

  const clear = useCallback(() => {
    builderService.clear();
  }, []);

  const hasComponent = useCallback(
    (name: string, viewMode: "desktop" | "mobile") =>
      builderService.hasComponent(name, viewMode),
    []
  );

  const getComponents = useCallback(
    (viewMode: "desktop" | "mobile") => builderService.getComponents(viewMode),
    []
  );

  const getComponentNames = useCallback(
    (viewMode: "desktop" | "mobile") =>
      builderService.getComponentNames(viewMode),
    []
  );

  const findComponents = useCallback(
    (predicate: (component: ComponentState) => boolean) =>
      builderService.findComponents(predicate),
    []
  );

  const findComponentsByName = useCallback(
    (name: string) => builderService.findComponentsByName(name),
    []
  );

  const exportState = useCallback(() => {
    return builderService.exportState();
  }, []);

  const importState = useCallback((stateJson: string) => {
    return builderService.importState(stateJson);
  }, []);

  const undo = useCallback(() => {
    return builderService.undo();
  }, []);

  const redo = useCallback(() => {
    return builderService.redo();
  }, []);

  const setProjectName = useCallback((name: string) => {
    builderService.setProjectName(name);
  }, []);

  const selectComponent = useCallback((componentId: string | null) => {
    builderService.selectComponent(componentId);
  }, []);

  const getSelectedComponent = useCallback(() => {
    return builderService.getSelectedComponent();
  }, []);

  const stats = builderService.getStats();
  const projectName = builderService.getProjectName();
  return {
    components,
    stats,
    addComponent,
    removeComponent,
    removeComponentById,
    updateComponent,
    getComponent,
    clear,
    hasComponent,
    getComponents,
    getComponentNames,
    findComponents,
    findComponentsByName,
    exportState,
    importState,
    canUndo,
    canRedo,
    undo,
    redo,
    projectName,
    setProjectName,
    selectComponent,
    getSelectedComponent,
    selectedComponentId: components.selectedComponentId,
  };
}
