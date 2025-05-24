import { useState, useEffect, useCallback } from "react";
import { builderService } from "./builder";

export function useBuilder(): {
  components: { desktop: string[]; mobile: string[] };
  addComponent: (name: string, viewMode: "desktop" | "mobile") => void;
  removeComponent: (name: string, viewMode: "desktop" | "mobile") => void;
  clear: () => void;
  hasComponent: (name: string, viewMode: "desktop" | "mobile") => boolean;
  getComponents: (viewMode: "desktop" | "mobile") => string[];
} {
  const [components, setComponents] = useState<{
    desktop: string[];
    mobile: string[];
  }>(() => builderService.getState());

  useEffect(() => {
    const unsubscribe = builderService.subscribe(() => {
      setComponents(builderService.getState());
    });
    return unsubscribe;
  }, []);

  const addComponent = useCallback(
    (name: string, viewMode: "desktop" | "mobile") => {
      builderService.addComponent(name, viewMode);
    },
    []
  );

  const removeComponent = useCallback(
    (name: string, viewMode: "desktop" | "mobile") => {
      builderService.removeComponent(name, viewMode);
    },
    []
  );

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

  return {
    components,
    addComponent,
    removeComponent,
    clear,
    hasComponent,
    getComponents,
  };
}
