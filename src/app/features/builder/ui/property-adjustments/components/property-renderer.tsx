import type { JSX } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import {
  getCompiledSettings,
  type SettingsObject,
} from "../services/settings-compiler";
import type { ComponentFileData } from "../../content-renderer/types";
import styles from "./property-renderer.module.css";

interface PropertyValue {
  [key: string]: unknown;
}

interface ComponentState {
  error: string;
  isRendering: boolean;
}

function useComponentState(): {
  error: string;
  isRendering: boolean;
  setError: (error: string) => void;
  setRendering: (isRendering: boolean) => void;
  clearError: () => void;
} {
  const [state, setState] = useState<ComponentState>({
    error: "",
    isRendering: false,
  });

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setRendering = useCallback((isRendering: boolean) => {
    setState((prev) => ({ ...prev, isRendering }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: "" }));
  }, []);

  return {
    ...state,
    setError,
    setRendering,
    clearError,
  };
}

class SettingsRenderer {
  private readonly hostElement: HTMLDivElement;
  private readonly onError: (error: string) => void;
  private readonly onUpdate: (
    id: string,
    updates: { props: PropertyValue }
  ) => void;
  constructor(
    hostElement: HTMLDivElement,
    onError: (error: string) => void,
    onUpdate: (id: string, updates: { props: PropertyValue }) => void
  ) {
    this.hostElement = hostElement;
    this.onError = onError;
    this.onUpdate = onUpdate;
  }

  private clearHost(): void {
    this.hostElement.innerHTML = "";
  }

  private getSettingsContent(files?: ComponentFileData[]): string | undefined {
    return files?.find((f: ComponentFileData) => f.file === "settings.ts")
      ?.content;
  }

  private validateSettingsObject(
    settingsObject: SettingsObject | null
  ): settingsObject is SettingsObject {
    return !!(settingsObject && typeof settingsObject.draw === "function");
  }
  private setupSettingsHandlers(
    settingsObject: SettingsObject,
    componentId: string,
    currentProps?: PropertyValue
  ): void {
    if (typeof settingsObject.setOnChange === "function") {
      settingsObject.setOnChange((newValues: PropertyValue) => {
        const mergedProps = { ...(currentProps || {}), ...newValues };
        this.onUpdate(componentId, {
          props: mergedProps,
        });
      });
    }
  }
  private applySettingsStyles(
    settingsObject: SettingsObject,
    _componentId: string,
    currentProps?: PropertyValue
  ): void {
    if ((!currentProps || Object.keys(currentProps).length === 0) && 
        typeof settingsObject.getValues === "function") {
      const defaultValues = settingsObject.getValues();
      this.onUpdate(_componentId, { props: { ...defaultValues } });
    }

    if (currentProps && typeof settingsObject.setValue === "function") {
      settingsObject.setValue(currentProps);
    }
  }

  async render(component: {
    id?: string;
    name: string;
    compiledData?: { files?: ComponentFileData[] };
    props?: PropertyValue;
  }): Promise<void> {
    try {
      this.clearHost();

      const settingsContent = this.getSettingsContent(
        component.compiledData?.files
      );
      if (!settingsContent) {
        this.onError("No settings available for this component");
        return;
      }

      const settingsObject = getCompiledSettings(
        component.name,
        settingsContent
      );

      if (!this.validateSettingsObject(settingsObject)) {
        this.onError("Invalid settings configuration for this component");
        return;
      }

      const element = settingsObject.draw();
      this.hostElement.appendChild(element);

      if (component.id) {
        this.applySettingsStyles(settingsObject, component.id, component.props);

        this.setupSettingsHandlers(
          settingsObject,
          component.id,
          component.props
        );
      }

      this.onError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to render settings";
      this.onError(errorMessage);
    }
  }

  clear(): void {
    this.clearHost();
  }
}

function EmptyState(): JSX.Element {
  return (
    <div className={styles.container}>
      <div className={styles.noComponent}>No component selected</div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  componentName: string;
}

function ErrorState({ error, componentName }: ErrorStateProps): JSX.Element {
  return (
    <div className={styles.error}>
      <p>Error: {error}</p>
      <p className={styles.noSettings}>
        No properties available for {componentName}
      </p>
    </div>
  );
}

interface HeaderProps {
  componentName: string;
}

function Header({ componentName }: HeaderProps): JSX.Element {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>Component Properties</h3>
      <p className={styles.componentName}>Component: {componentName}</p>
    </div>
  );
}

export function PropertyRenderer(): JSX.Element {
  const { getSelectedComponent, updateComponent } = useBuilder();
  const { error, setError, clearError } = useComponentState();
  const settingsHost = useRef<HTMLDivElement>(null);
  const settingsRenderer = useRef<SettingsRenderer | null>(null);

  const selectedComponent = getSelectedComponent();

  useEffect(() => {
    if (settingsHost.current && !settingsRenderer.current) {
      settingsRenderer.current = new SettingsRenderer(
        settingsHost.current,
        setError,
        updateComponent
      );
    }
  }, [setError, updateComponent]);

  useEffect(() => {
    const renderer = settingsRenderer.current;

    if (!selectedComponent || !renderer) {
      clearError();
      renderer?.clear();
      return;
    }

    renderer.render(selectedComponent);
  }, [selectedComponent, clearError]);

  if (!selectedComponent) {
    return <EmptyState />;
  }

  return (
    <div className={styles.container}>
      <Header componentName={selectedComponent.name} />

      <div className={styles.settingsHost} ref={settingsHost} />

      {error && (
        <ErrorState error={error} componentName={selectedComponent.name} />
      )}
    </div>
  );
}
