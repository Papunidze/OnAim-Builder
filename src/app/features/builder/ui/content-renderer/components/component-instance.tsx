import { useMemo, memo, useCallback } from "react";
import type { JSX } from "react";
import type { ComponentRenderProps } from "../types";
import styles from "./component-instance.module.css";
import { ErrorBoundary } from "@app-shared/components";
import { useBuilder } from "@app-shared/services/builder";
import {
  getCompiledSettings,
  MobileValuesService,
} from "@app-features/builder/ui/property-adjustments/services";
import { compileLanguageObject } from "@app-features/builder/ui/language/compiler/language-compiler";
import type { ComponentState } from "@app-shared/services/builder";

interface CachedProps {
  settings: Record<string, unknown>;
  language: Record<string, unknown>;
  languageObject: unknown;
  cacheKey: string;
}

const propsCache = new WeakMap<ComponentState, CachedProps>();
const componentKeyCache = new Map<string, string>();
const componentInstanceCache = new Map<
  string,
  React.ComponentType<Record<string, unknown>>
>();

function getComponentCacheKey(
  instance: { id: string },
  component: ComponentState | undefined
): string {
  if (!component?.compiledData?.files) return `${instance.id}-no-files`;

  const timestamp = component.timestamp || 0;
  const cacheKey = `${instance.id}-${timestamp}`;

  if (componentKeyCache.has(cacheKey)) {
    return componentKeyCache.get(cacheKey)!;
  }

  const languageFile = component.compiledData.files.find(
    (file: { file: string }) => file.file === "language.ts"
  );
  const settingsFile = component.compiledData.files.find(
    (file: { file: string }) => file.file === "settings.ts"
  );

  const contentHash = [
    languageFile?.content || "",
    settingsFile?.content || "",
    timestamp,
  ].join("|");

  const finalKey = `${instance.id}-${contentHash.length}-${timestamp}`;
  componentKeyCache.set(cacheKey, finalKey);
  return finalKey;
}

function computeComponentProps(
  component: ComponentState | undefined
): Record<string, unknown> {
  const defaultResult = {
    settings: {},
    language: {},
    languageObject: null,
  };

  if (!component) return defaultResult;

  const cacheKey = `${component.id}-${component.timestamp}-${JSON.stringify(component.props)}`;

  if (propsCache.has(component)) {
    const cached = propsCache.get(component)!;
    if (cached.cacheKey === cacheKey) {
      return {
        settings: cached.settings,
        language: cached.language,
        languageObject: cached.languageObject,
      };
    }
  }

  if (!component?.compiledData?.files) {
    const result: CachedProps = {
      settings: component.props || {},
      language: {},
      languageObject: null,
      cacheKey,
    };
    propsCache.set(component, result);
    return {
      settings: result.settings,
      language: result.language,
      languageObject: result.languageObject,
    };
  }

  const settingsFile = component.compiledData.files.find(
    (file: { file: string }) => file.file === "settings.ts"
  );
  const languageFile = component.compiledData.files.find(
    (file: { file: string }) => file.file === "language.ts"
  );

  let languageObject = null;
  let languageValue = {};

  try {
    if (languageFile?.content) {
      languageObject = compileLanguageObject(
        languageFile.content,
        component.name
      );

      if (languageObject) {
        const currentLang = languageObject.getCurrentLanguage();
        if (typeof languageObject.getTranslationsWithFallback === "function") {
          languageValue =
            languageObject.getTranslationsWithFallback(currentLang, "en") || {};
        } else {
          const allLanguageData = languageObject.getLanguageData();
          const currentTranslations = allLanguageData?.[currentLang] || {};
          const defaultTranslations = allLanguageData?.["en"] || {};
          languageValue = {
            ...defaultTranslations,
            ...currentTranslations,
          };
        }
      }
    }
  } catch {
    languageValue = {};
  }

  if (!settingsFile?.content) {
    const result: CachedProps = {
      settings: component.props || {},
      language: languageValue,
      languageObject,
      cacheKey,
    };
    propsCache.set(component, result);
    return {
      settings: result.settings,
      language: result.language,
      languageObject: result.languageObject,
    };
  }

  let settingsObject;
  let settingsValue = {};

  try {
    settingsObject = getCompiledSettings(component.name, settingsFile.content);

    if (settingsObject && typeof settingsObject.getValues === "function") {
      let defaultValues = settingsObject.getValues() || {};
      const hasExistingProps =
        component.props && Object.keys(component.props).length > 0;

      if (
        component.viewMode === "mobile" &&
        typeof settingsObject.getMobileValues === "function"
      ) {
        try {
          const mobileResult =
            MobileValuesService.getFilteredMobileValues(settingsObject);
          const mobileValues = mobileResult.success ? mobileResult.data : {};

          if (mobileValues && Object.keys(mobileValues).length > 0) {
            const deepMerge = (
              target: Record<string, unknown>,
              source: Record<string, unknown>
            ): Record<string, unknown> => {
              const result = { ...target };
              for (const key in source) {
                if (
                  source[key] &&
                  typeof source[key] === "object" &&
                  !Array.isArray(source[key])
                ) {
                  result[key] = deepMerge(
                    (target[key] as Record<string, unknown>) || {},
                    source[key] as Record<string, unknown>
                  );
                } else {
                  result[key] = source[key];
                }
              }
              return result;
            };

            defaultValues = hasExistingProps
              ? deepMerge(
                  deepMerge(
                    defaultValues as Record<string, unknown>,
                    component.props as Record<string, unknown>
                  ),
                  mobileValues as Record<string, unknown>
                )
              : deepMerge(
                  defaultValues as Record<string, unknown>,
                  mobileValues as Record<string, unknown>
                );
          } else {
            defaultValues = hasExistingProps
              ? { ...defaultValues, ...component.props }
              : defaultValues;
          }
        } catch {
          defaultValues = hasExistingProps
            ? { ...defaultValues, ...component.props }
            : defaultValues;
        }
      } else {
        defaultValues = hasExistingProps
          ? { ...defaultValues, ...component.props }
          : defaultValues;
      }

      settingsValue = {
        ...defaultValues,
        ...(component.props || {}),
      };
    } else {
      settingsValue = component.props || {};
    }
  } catch {
    settingsValue = component.props || {};
  }

  const result: CachedProps = {
    settings: settingsValue,
    language: languageValue,
    languageObject,
    cacheKey,
  };

  propsCache.set(component, result);
  return {
    settings: result.settings,
    language: result.language,
    languageObject: result.languageObject,
  };
}

const MemoizedComponentWrapper = memo(
  ({
    Component,
    props,
  }: {
    Component: React.ComponentType<Record<string, unknown>>;
    props: Record<string, unknown>;
  }) => {
    return <Component {...props} />;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.Component === nextProps.Component &&
      JSON.stringify(prevProps.props) === JSON.stringify(nextProps.props)
    );
  }
);

MemoizedComponentWrapper.displayName = "MemoizedComponentWrapper";

export const ComponentInstance = memo(function ComponentInstance({
  instance,
  onRetry,
}: ComponentRenderProps): JSX.Element {
  const { selectComponent, selectedComponentId, getComponent } = useBuilder();

  const component = useMemo(
    () => getComponent(instance.id),
    [getComponent, instance.id]
  );
  const isSelected = selectedComponentId === instance.id;

  const componentContentKey = useMemo(
    () => getComponentCacheKey(instance, component),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instance.id, component?.id, component?.timestamp]
  );

  const componentProps = useMemo(
    () => computeComponentProps(component),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [component?.timestamp, component?.props, component?.viewMode, component?.id]
  );

  const safeProps = useMemo(() => {
    const props = componentProps;

    if (!props || typeof props !== "object") {
      return {
        settings: component?.props || {},
        language: {},
        languageObject: null,
      };
    }

    return {
      settings: props.settings || component?.props || {},
      language: props.language || {},
      languageObject: props.languageObject || null,
    };
  }, [componentProps, component?.props]);

  const wrapperClassName = useMemo(
    () =>
      isSelected
        ? `${styles.componentWrapper} ${styles.selected}`
        : styles.componentWrapper,
    [isSelected]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      selectComponent(instance.id);
    },
    [selectComponent, instance.id]
  );

  const stableComponentInstance = useMemo(() => {
    if (instance.status !== "loaded" || !instance.component) return null;

    const componentKey = `${instance.id}-${instance.name}-${component?.timestamp}`;

    if (!componentInstanceCache.has(componentKey)) {
      componentInstanceCache.set(
        componentKey,
        instance.component as React.ComponentType<Record<string, unknown>>
      );
    }

    return componentInstanceCache.get(componentKey)!;
  }, [
    instance.status,
    instance.component,
    instance.id,
    instance.name,
    component?.timestamp,
  ]);

  if (instance.status === "idle" || instance.status === "loading") {
    return (
      <div key={componentContentKey} className={styles.componentLoading}>
        <div className={styles.loadingSpinner} />
        <span>Loading {instance.name}...</span>
      </div>
    );
  }

  if (instance.status === "error") {
    const retryCount = instance.retryCount || 0;
    const canRetry = retryCount < 3;

    return (
      <div key={componentContentKey} className={styles.componentError}>
        <div className={styles.errorHeader}>
          <strong>Error loading {instance.name}:</strong>
        </div>
        <div className={styles.errorMessage}>{instance.error}</div>

        {canRetry && (
          <button
            onClick={() => onRetry(instance.id)}
            className={styles.retryButton}
          >
            Retry ({retryCount}/3)
          </button>
        )}

        {instance.component && (
          <div className={styles.fallbackComponent}>
            <div className={styles.fallbackLabel}>
              Fallback to previous version:
            </div>
            <instance.component />
          </div>
        )}
      </div>
    );
  }

  if (stableComponentInstance) {
    return (
      <ErrorBoundary
        key={componentContentKey}
        componentName={instance.name}
        fallback={(error) => (
          <div className={styles.renderError}>
            <div className={styles.errorHeader}>
              <strong>Render Error in {instance.name}:</strong>
            </div>
            <div className={styles.errorMessage}>{error.message}</div>
            <div className={styles.errorDetails}>
              <details>
                <summary>Error Details</summary>
                <pre>{error.stack}</pre>
              </details>
            </div>
          </div>
        )}
      >
        <div className={wrapperClassName} onClick={handleClick}>
          <MemoizedComponentWrapper
            Component={stableComponentInstance}
            props={safeProps}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div key={componentContentKey} className={styles.componentPreparing}>
      Preparing {instance.name}...
    </div>
  );
});
