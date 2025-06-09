# API Reference

Complete API documentation for the Component Rendering System, including TypeScript interfaces, methods, and usage examples.

## 📚 Table of Contents

- [Core Components](#core-components)
- [Hooks](#hooks)
- [Services](#services)
- [Types and Interfaces](#types-and-interfaces)
- [Examples](#examples)

## 🧩 Core Components

### ContentRenderer

Main component for rendering dynamic components with mobile/desktop support.

```tsx
interface ContentRendererProps {
  components: ComponentState[];
  viewMode: "desktop" | "mobile";
}

function ContentRenderer(props: ContentRendererProps): JSX.Element
```

**Props:**
- `components` - Array of component states to render
- `viewMode` - Current view mode (desktop or mobile)

**Example:**
```tsx
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function App() {
  const components = [
    { id: '1', name: 'MyButton', status: 'loaded', props: { text: 'Click me' } },
    { id: '2', name: 'MyCard', status: 'loading' }
  ];

  return (
    <ContentRenderer 
      components={components}
      viewMode="desktop"
    />
  );
}
```

### ComponentInstance

Individual component wrapper handling rendering, props, and error states.

```tsx
interface ComponentRenderProps {
  instance: ComponentInstanceState;
  onRetry: (instanceId: string) => void;
}

function ComponentInstance(props: ComponentRenderProps): JSX.Element
```

**Props:**
- `instance` - Component instance state
- `onRetry` - Callback for retrying failed components

**Example:**
```tsx
import { ComponentInstance } from '@app-features/builder/ui/content-renderer';

function CustomRenderer({ instances, onRetry }) {
  return (
    <div>
      {instances.map(instance => (
        <ComponentInstance 
          key={instance.id}
          instance={instance}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}
```

## 🪝 Hooks

### useComponentInstances

Custom hook for managing component instances lifecycle and state.

```tsx
interface UseComponentInstancesOptions {
  maxRetryCount?: number;
}

interface UseComponentInstancesReturn {
  instances: ComponentInstanceState[];
  aggregatedStyles: string;
  retryComponent: (instanceId: string) => void;
  isPending: boolean;
}

function useComponentInstances(
  components: ComponentState[],
  options?: UseComponentInstancesOptions
): UseComponentInstancesReturn
```

**Parameters:**
- `components` - Array of component configurations
- `options` - Optional configuration object

**Returns:**
- `instances` - Array of component instance states
- `aggregatedStyles` - Combined CSS styles from all components
- `retryComponent` - Function to retry failed component loading
- `isPending` - Boolean indicating if any components are loading

**Example:**
```tsx
import { useComponentInstances } from '@app-features/builder/ui/content-renderer/hooks';

function CustomRenderer({ components }) {
  const { instances, aggregatedStyles, retryComponent, isPending } = 
    useComponentInstances(components, { maxRetryCount: 3 });

  return (
    <div>
      {aggregatedStyles && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyles }} />
      )}
      {isPending && <div>Loading components...</div>}
      {instances.map(instance => (
        <ComponentInstance 
          key={instance.id}
          instance={instance}
          onRetry={retryComponent}
        />
      ))}
    </div>
  );
}
```

### useBuilder

Hook for accessing builder context and state.

```tsx
interface UseBuilderReturn {
  components: ComponentState[];
  selectedComponentId: string | null;
  viewMode: "desktop" | "mobile";
  selectComponent: (id: string) => void;
  getComponent: (id: string) => ComponentState | undefined;
  updateComponent: (id: string, updates: Partial<ComponentState>) => void;
  setViewMode: (mode: "desktop" | "mobile") => void;
}

function useBuilder(): UseBuilderReturn
```

**Example:**
```tsx
import { useBuilder } from '@app-shared/services/builder';

function ComponentPanel() {
  const { 
    components, 
    selectedComponentId, 
    selectComponent,
    viewMode,
    setViewMode 
  } = useBuilder();

  return (
    <div>
      <button onClick={() => setViewMode('desktop')}>Desktop</button>
      <button onClick={() => setViewMode('mobile')}>Mobile</button>
      
      {components.map(component => (
        <div 
          key={component.id}
          className={selectedComponentId === component.id ? 'selected' : ''}
          onClick={() => selectComponent(component.id)}
        >
          {component.name}
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Services

### ComponentLoader Service

Service for loading and compiling dynamic components.

```tsx
interface ComponentFetchResult {
  component: React.ComponentType<unknown>;
  styles: string;
  prefix: string;
}

// Load a component by name and ID
function loadComponent(name: string, id: string): Promise<ComponentFetchResult>

// Invalidate cached component
function invalidateComponentCache(id: string): void
```

**Example:**
```tsx
import { loadComponent, invalidateComponentCache } from '@app-features/builder/ui/content-renderer/services';

async function loadCustomComponent() {
  try {
    const result = await loadComponent('MyButton', 'button-1');
    console.log('Component loaded:', result.component);
    console.log('Styles:', result.styles);
  } catch (error) {
    console.error('Failed to load component:', error);
    // Invalidate cache and retry
    invalidateComponentCache('button-1');
  }
}
```

### SettingsCompiler Service

Service for compiling TypeScript settings into executable objects.

```tsx
interface SettingsObject {
  draw: () => HTMLElement;
  setOnChange?: (callback: (values: Record<string, unknown>) => void) => void;
  setValue?: (values: Record<string, unknown>) => void;
  getValues?: () => Record<string, unknown>;
  getJson?: () => Record<string, unknown>;
  getMobileValues?: () => Record<string, unknown>;
  setMobileValues?: (values: Record<string, unknown>) => void;
  title?: string;
}

// Compile TypeScript settings content
function compileSettingsObject(tsContent: string): SettingsObject | null

// Get compiled settings with caching
function getCompiledSettings(
  componentName: string, 
  settingsContent?: string
): SettingsObject | null

// Clear settings cache
function clearSettingsCache(): void

// Clear cache for specific component
function clearSettingsCacheForComponent(componentName: string): void
```

**Example:**
```tsx
import { getCompiledSettings, compileSettingsObject } from '@app-features/builder/ui/property-adjustments/services';

function useComponentSettings(componentName: string, settingsContent: string) {
  const settingsObject = getCompiledSettings(componentName, settingsContent);
  
  const getDefaultValues = () => {
    return settingsObject?.getValues?.() || {};
  };
  
  const getMobileValues = () => {
    return settingsObject?.getMobileValues?.() || {};
  };
  
  return { settingsObject, getDefaultValues, getMobileValues };
}
```

### MobileValuesService

Service for managing mobile-specific component values.

```tsx
interface MobileValuesResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface SetMobileValuesResult {
  success: boolean;
  error?: string;
}

class MobileValuesService {
  // Get mobile values from settings object
  static getMobileValues(settingsObject: SettingsObject): MobileValuesResult
  
  // Set mobile values on settings object
  static setMobileValues(
    settingsObject: SettingsObject,
    values: Record<string, unknown>
  ): SetMobileValuesResult
  
  // Apply mobile values based on view mode
  static applyMobileValues(
    settingsObject: SettingsObject,
    viewMode: "desktop" | "mobile",
    onUpdate?: (values: Record<string, unknown>) => void
  ): MobileValuesResult
  
  // Check if settings object supports mobile values
  static supportsMobileValues(settingsObject: SettingsObject): boolean
  
  // Get filtered mobile values (differences from desktop)
  static getFilteredMobileValues(settingsObject: SettingsObject): MobileValuesResult
}
```

**Example:**
```tsx
import { MobileValuesService } from '@app-features/builder/ui/property-adjustments/services';

function useMobileValues(settingsObject: SettingsObject, viewMode: string) {
  const [values, setValues] = useState({});
  
  useEffect(() => {
    if (viewMode === 'mobile' && MobileValuesService.supportsMobileValues(settingsObject)) {
      const result = MobileValuesService.getMobileValues(settingsObject);
      if (result.success) {
        setValues(result.data || {});
      }
    } else {
      // Use desktop values
      const desktopValues = settingsObject.getValues?.() || {};
      setValues(desktopValues);
    }
  }, [settingsObject, viewMode]);
  
  const updateMobileValues = (newValues: Record<string, unknown>) => {
    const result = MobileValuesService.setMobileValues(settingsObject, newValues);
    if (result.success) {
      setValues(newValues);
    }
  };
  
  return { values, updateMobileValues };
}
```

## 📋 Types and Interfaces

### ComponentState

```tsx
interface ComponentState {
  id: string;
  name: string;
  timestamp?: number;
  props?: Record<string, unknown>;
  styles?: string;
  viewMode?: "desktop" | "mobile";
  compiledData?: {
    files: Array<{
      file: string;
      content: string;
    }>;
  };
}
```

### ComponentInstanceState

```tsx
interface ComponentInstanceState {
  id: string;
  name: string;
  status: "idle" | "loading" | "loaded" | "error";
  retryCount?: number;
  error?: string;
  component?: React.ComponentType<unknown>;
  styles: string;
  prefix: string;
}
```

### ComponentRenderProps

```tsx
interface ComponentRenderProps {
  instance: ComponentInstanceState;
  onRetry: (instanceId: string) => void;
}
```

### ContentRendererProps

```tsx
interface ContentRendererProps {
  components: ComponentState[];
  viewMode: "desktop" | "mobile";
}
```

## 💡 Examples

### Basic Component Rendering

```tsx
import React from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';
import { useBuilder } from '@app-shared/services/builder';

function BasicExample() {
  const { components, viewMode } = useBuilder();

  return (
    <div className="app">
      <ContentRenderer 
        components={components}
        viewMode={viewMode}
      />
    </div>
  );
}
```

### Custom Component Renderer

```tsx
import React from 'react';
import { useComponentInstances } from '@app-features/builder/ui/content-renderer/hooks';
import { ComponentInstance } from '@app-features/builder/ui/content-renderer';

function CustomRenderer({ components }) {
  const { instances, aggregatedStyles, retryComponent, isPending } = 
    useComponentInstances(components, { maxRetryCount: 5 });

  return (
    <div className="custom-renderer">
      {/* Inject aggregated styles */}
      {aggregatedStyles && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyles }} />
      )}
      
      {/* Loading indicator */}
      {isPending && (
        <div className="loading-overlay">
          <div className="spinner">Loading components...</div>
        </div>
      )}
      
      {/* Render components in a grid */}
      <div className="component-grid">
        {instances.map(instance => (
          <div key={instance.id} className="component-cell">
            <ComponentInstance 
              instance={instance}
              onRetry={retryComponent}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Mobile/Desktop Property Management

```tsx
import React, { useState, useEffect } from 'react';
import { MobileValuesService } from '@app-features/builder/ui/property-adjustments/services';
import { getCompiledSettings } from '@app-features/builder/ui/property-adjustments/services';

function PropertyPanel({ component, viewMode }) {
  const [values, setValues] = useState({});
  const [settingsObject, setSettingsObject] = useState(null);

  useEffect(() => {
    if (component.settingsContent) {
      const compiled = getCompiledSettings(component.name, component.settingsContent);
      setSettingsObject(compiled);
    }
  }, [component.name, component.settingsContent]);

  useEffect(() => {
    if (!settingsObject) return;

    if (viewMode === 'mobile' && MobileValuesService.supportsMobileValues(settingsObject)) {
      const result = MobileValuesService.getMobileValues(settingsObject);
      if (result.success) {
        setValues(result.data || {});
      }
    } else {
      const desktopValues = settingsObject.getValues?.() || {};
      setValues(desktopValues);
    }
  }, [settingsObject, viewMode]);

  const handleValueChange = (key: string, value: unknown) => {
    const newValues = { ...values, [key]: value };
    
    if (viewMode === 'mobile' && settingsObject) {
      MobileValuesService.setMobileValues(settingsObject, newValues);
    } else if (settingsObject) {
      settingsObject.setValue?.(newValues);
    }
    
    setValues(newValues);
  };

  return (
    <div className="property-panel">
      <h3>Properties ({viewMode})</h3>
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="property-field">
          <label>{key}</label>
          <input 
            type="text"
            value={String(value)}
            onChange={(e) => handleValueChange(key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
```

### Error Handling

```tsx
import React from 'react';
import { useComponentInstances } from '@app-features/builder/ui/content-renderer/hooks';

function RobustRenderer({ components }) {
  const { instances, retryComponent } = useComponentInstances(components);

  const handleGlobalRetry = () => {
    instances
      .filter(instance => instance.status === 'error')
      .forEach(instance => retryComponent(instance.id));
  };

  const errorCount = instances.filter(instance => instance.status === 'error').length;

  return (
    <div>
      {errorCount > 0 && (
        <div className="error-banner">
          {errorCount} component(s) failed to load.
          <button onClick={handleGlobalRetry}>Retry All</button>
        </div>
      )}
      
      {instances.map(instance => (
        <div key={instance.id}>
          {instance.status === 'error' ? (
            <div className="error-component">
              <h4>Error: {instance.name}</h4>
              <p>{instance.error}</p>
              <button onClick={() => retryComponent(instance.id)}>
                Retry ({instance.retryCount}/3)
              </button>
            </div>
          ) : (
            <ComponentInstance 
              instance={instance}
              onRetry={retryComponent}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

This API reference provides complete documentation for all public interfaces and methods in the Component Rendering System. For more examples and advanced usage patterns, see the [Examples Documentation](./examples/). 