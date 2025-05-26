import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useTransition,
  useCallback,
} from "react";
import type { ComponentState } from "@app-shared/services/builder";
import { useBuilder } from "@app-shared/services/builder";
import type {
  ComponentFetchResult,
  ComponentInstanceState,
  UseComponentInstancesOptions,
} from "../types";
import { loadComponent } from "../services/component-loader";

const MAX_RETRY_COUNT = 3;
const COMPONENT_LOAD_TIMEOUT = 10000;

const createComponentState = {
  idle: (id: string, name: string): ComponentInstanceState => ({
    id,
    name,
    status: "idle",
    retryCount: 0,
    component: undefined,
    styles: "",
    prefix: "",
  }),

  loading: (id: string, name: string): ComponentInstanceState => ({
    id,
    name,
    status: "loading",
    retryCount: 0,
    component: undefined,
    styles: "",
    prefix: "",
  }),

  loaded: (
    id: string,
    name: string,
    component: React.ComponentType<unknown> | undefined,
    styles: string,
    prefix: string
  ): ComponentInstanceState => ({
    id,
    name,
    status: "loaded",
    retryCount: 0,
    component,
    styles,
    prefix,
  }),

  error: (
    id: string,
    name: string,
    error: string,
    retryCount: number
  ): ComponentInstanceState => ({
    id,
    name,
    status: "error",
    error,
    retryCount,
    component: undefined,
    styles: "",
    prefix: "",
  }),
};

export function useComponentInstances(
  components: ComponentState[],
  options: UseComponentInstancesOptions = {}
): {
  instances: ComponentInstanceState[];
  aggregatedStyles: string;
  retryComponent: (instanceId: string) => void;
  isPending: boolean;
} {
  const { maxRetryCount = MAX_RETRY_COUNT } = options;
  const { updateComponent } = useBuilder();

  const [instances, setInstances] = useState<ComponentInstanceState[]>(() =>
    components.map((comp) => createComponentState.idle(comp.id, comp.name))
  );
  const [isPending, startTransition] = useTransition();

  const loadingComponentsRef = useRef<Set<string>>(new Set());
  const loadedComponentsRef = useRef<Set<string>>(new Set());

  const componentIds = useMemo(
    () =>
      components
        .map((c) => c.id)
        .sort()
        .join(","),
    [components]
  );

  const updateInstance = useCallback(
    (
      instanceId: string,
      updater: (prev: ComponentInstanceState) => ComponentInstanceState
    ) => {
      setInstances((prev) =>
        prev.map((instance) =>
          instance.id === instanceId ? updater(instance) : instance
        )
      );
    },
    []
  );

  useEffect(() => {
    const currentComponentIds = new Set(components.map((c) => c.id));

    setInstances((prevInstances) => {
      const filteredInstances = prevInstances.filter((instance) =>
        currentComponentIds.has(instance.id)
      );

      const existingIds = new Set(filteredInstances.map((inst) => inst.id));
      const newInstances = components
        .filter((comp) => !existingIds.has(comp.id))
        .map((comp) => createComponentState.idle(comp.id, comp.name));

      return [...filteredInstances, ...newInstances];
    });

    for (const id of loadingComponentsRef.current) {
      if (!currentComponentIds.has(id)) {
        loadingComponentsRef.current.delete(id);
      }
    }

    for (const id of loadedComponentsRef.current) {
      if (!currentComponentIds.has(id)) {
        loadedComponentsRef.current.delete(id);
      }
    }
  }, [components]);

  const loadComponentWithTimeout = useCallback(
    async (comp: ComponentState): Promise<ComponentFetchResult> => {
      const loadPromise = loadComponent(comp.name, comp.id);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Timeout loading ${comp.name}`)),
          COMPONENT_LOAD_TIMEOUT
        );
      });

      return Promise.race([loadPromise, timeoutPromise]);
    },
    []
  );

  const handleComponentLoad = useCallback(
    async (comp: ComponentState) => {
      if (
        loadingComponentsRef.current.has(comp.id) ||
        loadedComponentsRef.current.has(comp.id)
      ) {
        return;
      }

      loadingComponentsRef.current.add(comp.id);

      try {
        startTransition(() => {
          updateInstance(comp.id, () =>
            createComponentState.loading(comp.id, comp.name)
          );
        });
        const result = await loadComponentWithTimeout(comp);

        loadedComponentsRef.current.add(comp.id);

        // Store compiled data in builder service to avoid redundant API calls
        if (result.compiledData) {
          updateComponent(comp.id, {
            compiledData: result.compiledData,
          });
        }

        startTransition(() => {
          updateInstance(comp.id, () =>
            createComponentState.loaded(
              comp.id,
              comp.name,
              result.component || undefined,
              result.styles,
              result.prefix
            )
          );
        });
      } catch (error) {
        console.error(
          `Failed to load component: ${comp.name} (${comp.id})`,
          error
        );

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        startTransition(() => {
          updateInstance(comp.id, (prev) =>
            createComponentState.error(
              comp.id,
              comp.name,
              errorMessage,
              (prev.retryCount || 0) + 1
            )
          );
        });
      } finally {
        loadingComponentsRef.current.delete(comp.id);
      }
    },
    [updateInstance, loadComponentWithTimeout, updateComponent]
  );

  useEffect(() => {
    const loadAllComponents = async (): Promise<void> => {
      const loadPromises = components.map(handleComponentLoad);
      await Promise.allSettled(loadPromises);
    };

    loadAllComponents();
  }, [componentIds, handleComponentLoad, components]);

  const retryComponent = useCallback(
    (instanceId: string) => {
      const instance = instances.find((inst) => inst.id === instanceId);

      if (!instance || (instance.retryCount || 0) >= maxRetryCount) {
        return;
      }

      const component = components.find((comp) => comp.id === instanceId);
      if (!component) {
        return;
      }

      loadingComponentsRef.current.delete(instanceId);
      loadedComponentsRef.current.delete(instanceId);

      handleComponentLoad(component);
    },
    [instances, maxRetryCount, components, handleComponentLoad]
  );

  const aggregatedStyles = useMemo(() => {
    return instances
      .filter((instance) => instance.status === "loaded" && instance.styles)
      .map((instance) => instance.styles)
      .join("\n");
  }, [instances]);

  return {
    instances,
    aggregatedStyles,
    retryComponent,
    isPending,
  };
}
