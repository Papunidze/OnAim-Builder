import type { JSX } from "react";
import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import {
  getCompiledSettings,
  type SettingsObject,
} from "../services/settings-compiler";
import styles from "./property-renderer.module.css";
import { MobileValuesService } from "../services/mobile-values.service";
import type { ComponentFileData } from "../../content-renderer";

interface PropertyValue {
  [key: string]: unknown;
}

interface ComponentState {
  error: string;
  isRendering: boolean;
}

const useComponentState = (): {
  error: string;
  isRendering: boolean;
  setError: (error: string) => void;
  setRendering: (isRendering: boolean) => void;
  clearError: () => void;
} => {
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
};

class SettingsRenderer {
  private readonly hostElement: HTMLDivElement;
  private readonly onError: (error: string) => void;
  private readonly onUpdate: (
    id: string,
    updates: { props: PropertyValue },
    options?: { skipHistory?: boolean; isMobileDefaultValue?: boolean }
  ) => void;
  private readonly viewMode: "desktop" | "mobile";
  private readonly onSettingsObjectChange: (
    settingsObject: SettingsObject | null
  ) => void;
  private readonly getIsAddingComponent: () => boolean;
  private readonly getIsUndoRedoInProgress: () => boolean;
  private isApplyingValues = false;
  private isInitializingMobile = false;
  private currentSettingsObject: SettingsObject | null = null;
  private propsCache = new WeakMap<SettingsObject, PropertyValue>();

  constructor(
    hostElement: HTMLDivElement,
    onError: (error: string) => void,
    onUpdate: (
      id: string,
      updates: { props: PropertyValue },
      options?: { skipHistory?: boolean; isMobileDefaultValue?: boolean }
    ) => void,
    viewMode: "desktop" | "mobile",
    onSettingsObjectChange: (settingsObject: SettingsObject | null) => void,
    getIsAddingComponent: () => boolean,
    getIsUndoRedoInProgress: () => boolean
  ) {
    this.hostElement = hostElement;
    this.onError = onError;
    this.onUpdate = onUpdate;
    this.viewMode = viewMode;
    this.onSettingsObjectChange = onSettingsObjectChange;
    this.getIsAddingComponent = getIsAddingComponent;
    this.getIsUndoRedoInProgress = getIsUndoRedoInProgress;
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
    componentId: string
  ): void {
    if (typeof settingsObject.setOnChange === "function") {
      settingsObject.setOnChange((newValues: PropertyValue) => {
        if (this.isApplyingValues) return;

        const mergedProps = { ...newValues };
        const shouldSkipHistory =
          this.isApplyingValues ||
          this.isInitializingMobile ||
          this.getIsAddingComponent() ||
          this.getIsUndoRedoInProgress();
        this.onUpdate(
          componentId,
          { props: mergedProps },
          { skipHistory: shouldSkipHistory }
        );

        if (
          this.viewMode === "mobile" &&
          typeof settingsObject.setMobileValues === "function" &&
          typeof settingsObject.getMobileValues === "function"
        ) {
          try {
            const isPartialUpdate = Object.keys(newValues).length < 5;
            if (isPartialUpdate) {
              const currentMobileValues =
                settingsObject.getMobileValues() || {};
              const updatedMobileValues = {
                ...currentMobileValues,
                ...newValues,
              };
              this.isApplyingValues = true;
              settingsObject.setMobileValues(updatedMobileValues);
              this.isApplyingValues = false;
            }
          } catch {
            this.isApplyingValues = false;
          }
        }
      });
    }
  }

  private applySettingsStyles(
    settingsObject: SettingsObject,
    componentId: string,
    currentProps?: PropertyValue
  ): void {
    this.isApplyingValues = true;

    try {
      if (this.viewMode === "mobile") {
        if (currentProps && Object.keys(currentProps).length > 0) {
          if (typeof settingsObject.setValue === "function") {
            const originalFlag = this.isApplyingValues;
            this.isApplyingValues = false;
            settingsObject.setValue(currentProps);
            this.isApplyingValues = originalFlag;
          }
        } else if (typeof settingsObject.getMobileValues === "function") {
          const existingMobileValues = settingsObject.getMobileValues();
          if (
            existingMobileValues &&
            Object.keys(existingMobileValues).length > 0
          ) {
            if (typeof settingsObject.setValue === "function") {
              const originalFlag = this.isApplyingValues;
              this.isApplyingValues = false;
              settingsObject.setValue(existingMobileValues);
              this.isApplyingValues = originalFlag;
            }
          } else {
            this.initializeMobileDefaults(
              settingsObject,
              componentId,
              currentProps
            );
          }
        } else {
          try {
            const mobileResult =
              MobileValuesService.getFilteredMobileValues(settingsObject);
            if (
              mobileResult.success &&
              mobileResult.data &&
              Object.keys(mobileResult.data).length > 0
            ) {
              if (typeof settingsObject.setValue === "function") {
                settingsObject.setValue(mobileResult.data);
              }
            }
          } catch {
            console.error("Failed to set mobile values");
          }
        }
      } else {
        if (typeof settingsObject.setValue === "function") {
          const valuesToUse =
            currentProps && Object.keys(currentProps).length > 0
              ? currentProps
              : typeof settingsObject.getValues === "function"
                ? settingsObject.getValues()
                : {};
          settingsObject.setValue(valuesToUse);
        }
      }
    } finally {
      this.isApplyingValues = false;
    }
  }

  private initializeMobileDefaults(
    settingsObject: SettingsObject,
    componentId: string,
    currentProps?: PropertyValue
  ): void {
    const wasAlreadyInitializing = this.isInitializingMobile;
    if (!wasAlreadyInitializing) {
      this.isInitializingMobile = true;
    }
    let valuesToSet: PropertyValue = {};
    let shouldSetMobileValues = false;

    try {
      if (this.propsCache.has(settingsObject)) {
        valuesToSet = this.propsCache.get(settingsObject)!;
        shouldSetMobileValues = true;
      } else {
        const mobileResult =
          MobileValuesService.getFilteredMobileValues(settingsObject);
        if (
          mobileResult.success &&
          mobileResult.data &&
          Object.keys(mobileResult.data).length > 0
        ) {
          valuesToSet = mobileResult.data;
          shouldSetMobileValues = true;
        } else if (currentProps && Object.keys(currentProps).length > 0) {
          valuesToSet = currentProps;
          shouldSetMobileValues = true;
        } else {
          const desktopDefaults =
            typeof settingsObject.getValues === "function"
              ? settingsObject.getValues()
              : {};
          if (Object.keys(desktopDefaults).length > 0) {
            valuesToSet = desktopDefaults;
            shouldSetMobileValues = true;
          }
        }
        this.propsCache.set(settingsObject, valuesToSet);
      }
    } catch {
      if (currentProps && Object.keys(currentProps).length > 0) {
        valuesToSet = currentProps;
        shouldSetMobileValues = true;
      } else {
        valuesToSet =
          typeof settingsObject.getValues === "function"
            ? settingsObject.getValues()
            : {};
        shouldSetMobileValues = true;
      }
    }

    if (
      shouldSetMobileValues &&
      typeof settingsObject.setMobileValues === "function"
    ) {
      settingsObject.setMobileValues(valuesToSet);
      this.onUpdate(
        componentId,
        { props: valuesToSet },
        { isMobileDefaultValue: true }
      );
    }

    if (typeof settingsObject.setValue === "function") {
      const originalFlag = this.isApplyingValues;
      this.isApplyingValues = false;
      settingsObject.setValue(valuesToSet);
      this.isApplyingValues = originalFlag;
    }

    if (!wasAlreadyInitializing) {
      this.isInitializingMobile = false;
    }
  }

  getMobileValues(
    settingsObject: SettingsObject
  ): Record<string, unknown> | null {
    if (typeof settingsObject.getMobileValues === "function") {
      try {
        return settingsObject.getMobileValues();
      } catch {
        this.onError("Failed to get mobile values");
        return null;
      }
    }
    return null;
  }

  setMobileValues(
    settingsObject: SettingsObject,
    values: Record<string, unknown>
  ): boolean {
    if (typeof settingsObject.setMobileValues === "function") {
      try {
        settingsObject.setMobileValues(values);
        return true;
      } catch {
        this.onError("Failed to set mobile values");
        return false;
      }
    }
    return false;
  }

  forceUpdateSettingsUI(props: PropertyValue): void {
    if (
      this.currentSettingsObject &&
      typeof this.currentSettingsObject.setValue === "function"
    ) {
      try {
        const wasApplyingValues = this.isApplyingValues;
        this.isApplyingValues = true;
        this.currentSettingsObject.setValue(props);
        this.isApplyingValues = wasApplyingValues;
      } catch {
        console.error("Failed to update settings UI");
        this.isApplyingValues = false;
      }
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
      this.currentSettingsObject = null;
      this.propsCache = new WeakMap<SettingsObject, PropertyValue>();

      const settingsContent = this.getSettingsContent(
        component.compiledData?.files
      );
      if (!settingsContent) {
        this.onError("No settings available for this component");
        this.onSettingsObjectChange(null);
        return;
      }

      const settingsObject = getCompiledSettings(
        component.name,
        settingsContent
      );

      if (!this.validateSettingsObject(settingsObject)) {
        this.onError("Invalid settings configuration for this component");
        this.onSettingsObjectChange(null);
        return;
      }

      this.currentSettingsObject = settingsObject;
      const element = settingsObject.draw();
      this.hostElement.appendChild(element);

      if (component.id) {
        this.setupSettingsHandlers(settingsObject, component.id);
        await new Promise((resolve) => setTimeout(resolve, 1));

        const isUndoRedoInProgress = this.getIsUndoRedoInProgress();

        let propsToUse = component.props;

        if (
          isUndoRedoInProgress &&
          component.props &&
          Object.keys(component.props).length > 0 &&
          this.viewMode === "mobile"
        ) {
          if (typeof settingsObject.setMobileValues === "function") {
            settingsObject.setMobileValues(component.props);
          }
          propsToUse = component.props;
        } else if (this.viewMode === "mobile" && this.getIsAddingComponent()) {
          try {
            this.isInitializingMobile = true;

            let baseDefaults = {};
            if (typeof settingsObject.getValues === "function") {
              baseDefaults = settingsObject.getValues() || {};
            }

            const mobileResult =
              MobileValuesService.getFilteredMobileValues(settingsObject);

            if (
              mobileResult.success &&
              mobileResult.data &&
              Object.keys(mobileResult.data).length > 0
            ) {
              propsToUse = { ...baseDefaults, ...mobileResult.data };
            } else {
              if (typeof settingsObject.getMobileValues === "function") {
                const directMobileValues = settingsObject.getMobileValues();
                if (
                  directMobileValues &&
                  Object.keys(directMobileValues).length > 0
                ) {
                  propsToUse = { ...baseDefaults, ...directMobileValues };
                } else {
                  propsToUse = baseDefaults;
                }
              } else {
                propsToUse = baseDefaults;
              }
            }

            if (component.id && propsToUse) {
              this.onUpdate(
                component.id,
                { props: propsToUse },
                { isMobileDefaultValue: true }
              );
            }
          } catch (error) {
            console.error("Failed to apply mobile defaults:", error);
          }
        } else if (
          this.viewMode === "mobile" &&
          (!propsToUse || Object.keys(propsToUse).length === 0)
        ) {
          try {
            this.isInitializingMobile = true;
            const mobileResult =
              MobileValuesService.getFilteredMobileValues(settingsObject);
            if (
              mobileResult.success &&
              mobileResult.data &&
              Object.keys(mobileResult.data).length > 0
            ) {
              propsToUse = mobileResult.data;
              if (component.id) {
                this.onUpdate(
                  component.id,
                  { props: propsToUse },
                  { isMobileDefaultValue: true }
                );
              }
            } else {
              // Try to get component defaults if no mobile values
              if (typeof settingsObject.getValues === "function") {
                const defaultValues = settingsObject.getValues();
                if (defaultValues && Object.keys(defaultValues).length > 0) {
                  propsToUse = defaultValues;
                  if (component.id) {
                    this.onUpdate(
                      component.id,
                      { props: propsToUse },
                      { isMobileDefaultValue: true }
                    );
                  }
                }
              }
            }
          } catch (error) {
            console.error("Failed to update settings UI:", error);
          }
          // Don't reset flag yet - applySettingsStyles will also trigger onChange
        } else {
          // Using existing props or desktop mode
        }

        this.applySettingsStyles(settingsObject, component.id, propsToUse);

        if (this.viewMode === "mobile" && this.isInitializingMobile) {
          this.isInitializingMobile = false;
        }
      }

      this.onError("");
      this.onSettingsObjectChange(settingsObject);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to render settings";
      this.onError(errorMessage);
      this.onSettingsObjectChange(null);
    }
  }

  clear(): void {
    this.clearHost();
    this.currentSettingsObject = null;
    this.propsCache = new WeakMap<SettingsObject, PropertyValue>();
    this.onSettingsObjectChange(null);
  }
}

const EmptyState = memo(() => (
  <div className={styles.container}>
    <div className={styles.noComponent}>No component selected</div>
  </div>
));

EmptyState.displayName = "EmptyState";

const ErrorState = memo(
  ({ error, componentName }: { error: string; componentName: string }) => (
    <div className={styles.error}>
      <p>Error: {error}</p>
      <p className={styles.noSettings}>
        No properties available for {componentName}
      </p>
    </div>
  )
);

ErrorState.displayName = "ErrorState";

const Header = memo(({ componentName }: { componentName: string }) => (
  <div className={styles.header}>
    <h3 className={styles.title}>Component Properties</h3>
    <p className={styles.componentName}>Component: {componentName}</p>
  </div>
));

Header.displayName = "Header";

export const PropertyRenderer = memo(function PropertyRenderer({
  viewMode,
}: {
  viewMode: "desktop" | "mobile";
}): JSX.Element {
  const {
    getSelectedComponent,
    updateComponent,
    selectedComponentId,
    getIsAddingComponent,
    components,
    getIsUndoRedoInProgress,
  } = useBuilder();
  const { error, setError, clearError } = useComponentState();
  const settingsHost = useRef<HTMLDivElement>(null);
  const settingsRenderer = useRef<SettingsRenderer | null>(null);
  const [, setCurrentSettingsObject] = useState<SettingsObject | null>(null);
  const previousPropsRef = useRef<PropertyValue | undefined>(undefined);
  const previousComponentIdRef = useRef<string | undefined>(undefined);

  const selectedComponent = useMemo(
    () => getSelectedComponent(),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [getSelectedComponent, components]
  );

  useEffect(() => {
    if (settingsHost.current && !settingsRenderer.current) {
      settingsRenderer.current = new SettingsRenderer(
        settingsHost.current,
        setError,
        updateComponent,
        viewMode,
        setCurrentSettingsObject,
        getIsAddingComponent,
        getIsUndoRedoInProgress
      );
    }
  }, [
    setError,
    updateComponent,
    viewMode,
    getIsAddingComponent,
    getIsUndoRedoInProgress,
  ]);

  useEffect(() => {
    const renderer = settingsRenderer.current;

    if (!selectedComponent || !renderer) {
      clearError();
      renderer?.clear();
      previousPropsRef.current = undefined;
      previousComponentIdRef.current = undefined;
      return;
    }

    renderer.render(selectedComponent).then(() => {
      previousPropsRef.current = selectedComponent.props;
      previousComponentIdRef.current = selectedComponent.id;
    });
  }, [selectedComponent, selectedComponentId, clearError]);

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
});
