# Best Practices Guide

Comprehensive best practices for developing with the Component Rendering System, including coding standards, performance guidelines, and common pitfalls to avoid.

## 📚 Table of Contents

- [Development Guidelines](#development-guidelines)
- [Component Design Patterns](#component-design-patterns)
- [Performance Best Practices](#performance-best-practices)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Testing Strategies](#testing-strategies)
- [Security Considerations](#security-considerations)
- [Common Pitfalls](#common-pitfalls)

## 🏗️ Development Guidelines

### Code Organization

#### File Structure
```
src/
├── components/
│   ├── renderers/
│   │   ├── ContentRenderer.tsx
│   │   ├── ComponentInstance.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useComponentInstances.ts
│   │   ├── useStableObject.ts
│   │   └── index.ts
│   └── services/
│       ├── ComponentLoader.ts
│       ├── SettingsCompiler.ts
│       └── index.ts
├── types/
│   ├── components.ts
│   ├── renderer.ts
│   └── index.ts
└── utils/
    ├── memoization.ts
    ├── performance.ts
    └── index.ts
```

#### Naming Conventions

```tsx
// ✅ Good: Descriptive, consistent naming
interface ComponentInstanceState {
  id: string;
  name: string;
  status: ComponentStatus;
}

const useComponentInstances = (components: ComponentState[]) => {
  // Hook implementation
};

class ComponentLoader {
  static async loadComponent(name: string): Promise<ComponentFetchResult> {
    // Implementation
  }
}

// ❌ Bad: Generic, unclear naming
interface State {
  id: string;
  n: string;
  s: string;
}

const useComps = (comps: any[]) => {
  // Hook implementation
};

class Loader {
  static async load(n: string): Promise<any> {
    // Implementation
  }
}
```

#### Import/Export Patterns

```tsx
// ✅ Good: Explicit, organized imports
import React, { memo, useMemo, useCallback } from 'react';
import type { ComponentState, ComponentInstanceState } from '../types';
import { useComponentInstances } from '../hooks';
import { ComponentInstance } from './ComponentInstance';

// ✅ Good: Clear re-exports
export { ContentRenderer } from './ContentRenderer';
export { ComponentInstance } from './ComponentInstance';
export type { ContentRendererProps, ComponentRenderProps } from './types';

// ❌ Bad: Wildcard imports
import * as React from 'react';
import * from '../types';
import * from '../hooks';
```

### TypeScript Best Practices

#### Strict Type Definitions

```tsx
// ✅ Good: Strict, well-defined types
interface ComponentState {
  readonly id: string;
  readonly name: string;
  readonly status: 'idle' | 'loading' | 'loaded' | 'error';
  readonly timestamp?: number;
  readonly props?: Readonly<Record<string, unknown>>;
}

type ComponentStatus = ComponentState['status'];

interface UseComponentInstancesOptions {
  readonly maxRetryCount?: number;
  readonly loadTimeout?: number;
}

// ❌ Bad: Loose typing
interface ComponentState {
  id: any;
  name: any;
  status: string;
  timestamp: any;
  props: any;
}
```

#### Generic Constraints

```tsx
// ✅ Good: Proper generic constraints
interface ComponentLoader<T extends ComponentState = ComponentState> {
  load(component: T): Promise<ComponentFetchResult>;
}

function createMemoizedSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): (state: T) => R {
  // Implementation
}

// ❌ Bad: Unconstrained generics
interface ComponentLoader<T = any> {
  load(component: T): Promise<any>;
}

function createMemoizedSelector<T, R>(
  selector: any,
  equalityFn?: any
): any {
  // Implementation
}
```

### Component Design Patterns

#### Composition over Inheritance

```tsx
// ✅ Good: Composition-based design
interface RendererProps {
  components: ComponentState[];
  viewMode: 'desktop' | 'mobile';
  children?: React.ReactNode;
}

function ContentRenderer({ components, viewMode, children }: RendererProps) {
  return (
    <div className={`renderer renderer--${viewMode}`}>
      <ComponentList components={components} />
      {children}
    </div>
  );
}

// Compose functionality
function EnhancedContentRenderer(props: RendererProps) {
  return (
    <ErrorBoundary>
      <PerformanceMonitor>
        <ContentRenderer {...props} />
      </PerformanceMonitor>
    </ErrorBoundary>
  );
}

// ❌ Bad: Inheritance-heavy design
class BaseRenderer extends React.Component {
  // Base implementation
}

class ContentRenderer extends BaseRenderer {
  // Extended implementation
}

class EnhancedContentRenderer extends ContentRenderer {
  // Further extension
}
```

#### Prop Interface Design

```tsx
// ✅ Good: Well-structured props
interface ComponentInstanceProps {
  // Required props first
  instance: ComponentInstanceState;
  onRetry: (instanceId: string) => void;
  
  // Optional props with defaults
  showMetrics?: boolean;
  retryDelay?: number;
  
  // Styling props
  className?: string;
  style?: React.CSSProperties;
  
  // Event handlers
  onLoad?: (instance: ComponentInstanceState) => void;
  onError?: (instance: ComponentInstanceState, error: Error) => void;
}

// ✅ Good: Default props pattern
const defaultProps: Required<Pick<ComponentInstanceProps, 'showMetrics' | 'retryDelay'>> = {
  showMetrics: false,
  retryDelay: 1000
};

function ComponentInstance(props: ComponentInstanceProps) {
  const { showMetrics, retryDelay, ...rest } = { ...defaultProps, ...props };
  // Implementation
}

// ❌ Bad: Unclear prop structure
interface ComponentInstanceProps {
  data: any;
  config: any;
  options: any;
  handlers: any;
}
```

## ⚡ Performance Best Practices

### Memoization Strategies

#### Smart Memoization

```tsx
// ✅ Good: Strategic memoization with proper dependencies
const ComponentInstance = memo(({ instance, onRetry }: ComponentRenderProps) => {
  // Only memoize expensive computations
  const computedProps = useMemo(() => {
    if (instance.status !== 'loaded') return {};
    
    return computeExpensiveProps(instance);
  }, [instance.id, instance.status, instance.timestamp]);

  // Stable callback references
  const handleRetry = useCallback(() => {
    onRetry(instance.id);
  }, [onRetry, instance.id]);

  return (
    <div className="component-instance">
      {/* Component content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for complex objects
  return (
    prevProps.instance.id === nextProps.instance.id &&
    prevProps.instance.status === nextProps.instance.status &&
    prevProps.instance.timestamp === nextProps.instance.timestamp &&
    prevProps.onRetry === nextProps.onRetry
  );
});

// ❌ Bad: Over-memoization or missing dependencies
const ComponentInstance = memo(({ instance, onRetry }: ComponentRenderProps) => {
  // Expensive computation on every render
  const computedProps = computeExpensiveProps(instance);

  // Missing dependency array
  const handleRetry = useCallback(() => {
    onRetry(instance.id);
  });

  return <div>{/* content */}</div>;
});
```

#### Stable References

```tsx
// ✅ Good: Stable object and function references
function useStableCallbacks() {
  const callbacks = useRef({
    onLoad: (instance: ComponentInstanceState) => {
      console.log('Component loaded:', instance.name);
    },
    onError: (instance: ComponentInstanceState, error: Error) => {
      console.error('Component error:', instance.name, error);
    },
    onRetry: (instanceId: string) => {
      // Retry logic
    }
  });

  return callbacks.current;
}

// ❌ Bad: Creating new objects/functions on every render
function BadCallbacks() {
  return {
    onLoad: (instance: ComponentInstanceState) => {
      console.log('Component loaded:', instance.name);
    },
    onError: (instance: ComponentInstanceState, error: Error) => {
      console.error('Component error:', instance.name, error);
    }
  };
}
```

### Efficient State Updates

#### Batch State Updates

```tsx
// ✅ Good: Batched state updates
function useComponentInstances(components: ComponentState[]) {
  const [instances, setInstances] = useState<ComponentInstanceState[]>([]);
  
  const updateMultipleInstances = useCallback((updates: Array<{
    id: string;
    updates: Partial<ComponentInstanceState>;
  }>) => {
    setInstances(prevInstances => {
      // Single state update with all changes
      const updatesMap = new Map(updates.map(u => [u.id, u.updates]));
      
      return prevInstances.map(instance => {
        const instanceUpdates = updatesMap.get(instance.id);
        return instanceUpdates ? { ...instance, ...instanceUpdates } : instance;
      });
    });
  }, []);

  return { instances, updateMultipleInstances };
}

// ❌ Bad: Multiple separate state updates
function BadComponentInstances(components: ComponentState[]) {
  const [instances, setInstances] = useState<ComponentInstanceState[]>([]);
  
  const updateMultipleInstances = (updates: Array<{id: string; updates: any}>) => {
    // Multiple state updates - causes multiple re-renders
    updates.forEach(({ id, updates }) => {
      setInstances(prev => prev.map(instance => 
        instance.id === id ? { ...instance, ...updates } : instance
      ));
    });
  };

  return { instances, updateMultipleInstances };
}
```

#### Immutable State Updates

```tsx
// ✅ Good: Immutable state updates
function updateComponentState(
  state: ComponentState,
  updates: Partial<ComponentState>
): ComponentState {
  return {
    ...state,
    ...updates,
    timestamp: Date.now()
  };
}

function updateNestedComponentProps(
  component: ComponentState,
  propPath: string[],
  value: unknown
): ComponentState {
  const newProps = { ...component.props };
  let current = newProps;
  
  for (let i = 0; i < propPath.length - 1; i++) {
    current[propPath[i]] = { ...current[propPath[i]] };
    current = current[propPath[i]];
  }
  
  current[propPath[propPath.length - 1]] = value;
  
  return {
    ...component,
    props: newProps,
    timestamp: Date.now()
  };
}

// ❌ Bad: Mutating state directly
function badUpdateComponentState(
  state: ComponentState,
  updates: Partial<ComponentState>
): ComponentState {
  // Direct mutation - breaks React's optimization
  Object.assign(state, updates);
  state.timestamp = Date.now();
  return state;
}
```

## 🏪 State Management

### Local vs Global State

#### Use Local State When

```tsx
// ✅ Good: Local state for component-specific data
function ComponentPropertyEditor({ component }: { component: ComponentState }) {
  // Local state for editor-specific data
  const [isEditing, setIsEditing] = useState(false);
  const [draftValues, setDraftValues] = useState(component.props);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Local handlers
  const handleSave = useCallback(() => {
    if (validateDraftValues(draftValues)) {
      onSaveComponent(component.id, draftValues);
      setIsEditing(false);
    }
  }, [component.id, draftValues]);

  return (
    <div className="property-editor">
      {/* Editor UI */}
    </div>
  );
}
```

#### Use Global State When

```tsx
// ✅ Good: Global state for shared application data
interface BuilderContextValue {
  components: ComponentState[];
  selectedComponentId: string | null;
  viewMode: 'desktop' | 'mobile';
  
  selectComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ComponentState>) => void;
  setViewMode: (mode: 'desktop' | 'mobile') => void;
}

function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  
  const contextValue = useMemo(() => ({
    ...state,
    selectComponent: (id: string) => dispatch({ type: 'SELECT_COMPONENT', payload: id }),
    updateComponent: (id: string, updates: Partial<ComponentState>) => 
      dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } }),
    setViewMode: (mode: 'desktop' | 'mobile') => 
      dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }), [state]);

  return (
    <BuilderContext.Provider value={contextValue}>
      {children}
    </BuilderContext.Provider>
  );
}
```

### State Normalization

```tsx
// ✅ Good: Normalized state structure
interface NormalizedBuilderState {
  components: {
    byId: Record<string, ComponentState>;
    allIds: string[];
  };
  ui: {
    selectedComponentId: string | null;
    viewMode: 'desktop' | 'mobile';
    loading: Set<string>;
    errors: Record<string, string>;
  };
}

// Selectors for normalized state
const selectComponentById = (state: NormalizedBuilderState, id: string) =>
  state.components.byId[id];

const selectAllComponents = (state: NormalizedBuilderState) =>
  state.components.allIds.map(id => state.components.byId[id]);

const selectLoadingComponents = (state: NormalizedBuilderState) =>
  Array.from(state.ui.loading).map(id => state.components.byId[id]);

// ❌ Bad: Denormalized state structure
interface BadBuilderState {
  components: ComponentState[];
  selectedComponent: ComponentState | null;
  viewMode: 'desktop' | 'mobile';
  loadingComponents: ComponentState[];
  componentErrors: Array<{ component: ComponentState; error: string }>;
}
```

## 🚨 Error Handling

### Error Boundaries

```tsx
// ✅ Good: Comprehensive error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName?: string; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error
    console.error('Component Error Boundary:', error, errorInfo);
    
    // Report to error tracking service
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Component Error</h3>
          <p>Something went wrong in {this.props.componentName || 'component'}.</p>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Graceful Error Recovery

```tsx
// ✅ Good: Graceful error handling with recovery
function useComponentWithRetry(
  componentId: string,
  maxRetries: number = 3
) {
  const [state, setState] = useState({
    component: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  const loadComponent = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const component = await ComponentLoader.load(componentId);
      setState(prev => ({ 
        ...prev, 
        component, 
        loading: false, 
        retryCount: 0 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
    }
  }, [componentId]);

  const retry = useCallback(() => {
    if (state.retryCount < maxRetries) {
      setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
      loadComponent();
    }
  }, [state.retryCount, maxRetries, loadComponent]);

  useEffect(() => {
    loadComponent();
  }, [loadComponent]);

  return {
    ...state,
    canRetry: state.retryCount < maxRetries,
    retry
  };
}
```

## 🧪 Testing Strategies

### Unit Testing

```tsx
// ✅ Good: Comprehensive unit tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentInstance } from '../ComponentInstance';

describe('ComponentInstance', () => {
  const mockOnRetry = jest.fn();
  
  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  const createMockInstance = (overrides = {}) => ({
    id: 'test-component',
    name: 'TestComponent',
    status: 'loaded' as const,
    styles: '',
    prefix: 'test',
    component: () => <div>Test Component</div>,
    ...overrides
  });

  it('should render successfully when loaded', () => {
    const instance = createMockInstance();
    
    render(<ComponentInstance instance={instance} onRetry={mockOnRetry} />);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const instance = createMockInstance({ status: 'loading', component: undefined });
    
    render(<ComponentInstance instance={instance} onRetry={mockOnRetry} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle retry on error', async () => {
    const user = userEvent.setup();
    const instance = createMockInstance({ 
      status: 'error', 
      component: undefined,
      error: 'Failed to load'
    });
    
    render(<ComponentInstance instance={instance} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledWith('test-component');
  });

  it('should apply styles correctly', () => {
    const instance = createMockInstance({ 
      styles: '.test { color: red; }',
      prefix: 'test-prefix'
    });
    
    render(<ComponentInstance instance={instance} onRetry={mockOnRetry} />);
    
    const styleElement = document.querySelector('style');
    expect(styleElement?.textContent).toContain('.test { color: red; }');
  });
});
```

### Integration Testing

```tsx
// ✅ Good: Integration tests
import { render, screen, waitFor } from '@testing-library/react';
import { ContentRenderer } from '../ContentRenderer';
import { ComponentLoader } from '../services/ComponentLoader';

// Mock the ComponentLoader
jest.mock('../services/ComponentLoader');
const mockComponentLoader = ComponentLoader as jest.Mocked<typeof ComponentLoader>;

describe('ContentRenderer Integration', () => {
  beforeEach(() => {
    mockComponentLoader.load.mockClear();
  });

  it('should load and render multiple components', async () => {
    const mockComponent = () => <div>Loaded Component</div>;
    mockComponentLoader.load.mockResolvedValue({
      component: mockComponent,
      styles: '',
      prefix: 'test'
    });

    const components = [
      { id: '1', name: 'Component1', status: 'idle' as const },
      { id: '2', name: 'Component2', status: 'idle' as const }
    ];

    render(<ContentRenderer components={components} viewMode="desktop" />);

    // Wait for components to load
    await waitFor(() => {
      expect(screen.getAllByText('Loaded Component')).toHaveLength(2);
    });

    expect(mockComponentLoader.load).toHaveBeenCalledTimes(2);
  });

  it('should handle component loading errors gracefully', async () => {
    mockComponentLoader.load.mockRejectedValue(new Error('Load failed'));

    const components = [
      { id: '1', name: 'FailingComponent', status: 'idle' as const }
    ];

    render(<ContentRenderer components={components} viewMode="desktop" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Performance Testing

```tsx
// ✅ Good: Performance testing
import { render } from '@testing-library/react';
import { ContentRenderer } from '../ContentRenderer';

describe('ContentRenderer Performance', () => {
  it('should render large component lists efficiently', () => {
    const components = Array.from({ length: 100 }, (_, i) => ({
      id: `component-${i}`,
      name: 'TestComponent',
      status: 'loaded' as const
    }));

    const startTime = performance.now();
    
    render(<ContentRenderer components={components} viewMode="desktop" />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within acceptable time limit
    expect(renderTime).toBeLessThan(100); // 100ms
  });

  it('should not cause memory leaks', () => {
    const components = [
      { id: '1', name: 'TestComponent', status: 'loaded' as const }
    ];

    const { unmount } = render(
      <ContentRenderer components={components} viewMode="desktop" />
    );

    // Unmount and check for cleanup
    unmount();

    // Verify cleanup (this would require more sophisticated memory leak detection)
    expect(document.querySelectorAll('style')).toHaveLength(0);
  });
});
```

## 🔒 Security Considerations

### Input Validation

```tsx
// ✅ Good: Input validation and sanitization
function validateComponentState(component: unknown): ComponentState {
  if (!component || typeof component !== 'object') {
    throw new Error('Invalid component: must be an object');
  }

  const comp = component as Record<string, unknown>;

  if (typeof comp.id !== 'string' || !comp.id.trim()) {
    throw new Error('Invalid component: id must be a non-empty string');
  }

  if (typeof comp.name !== 'string' || !comp.name.trim()) {
    throw new Error('Invalid component: name must be a non-empty string');
  }

  const validStatuses = ['idle', 'loading', 'loaded', 'error'];
  if (!validStatuses.includes(comp.status as string)) {
    throw new Error(`Invalid component: status must be one of ${validStatuses.join(', ')}`);
  }

  // Sanitize props
  const sanitizedProps = comp.props ? sanitizeProps(comp.props) : undefined;

  return {
    id: comp.id,
    name: comp.name,
    status: comp.status as ComponentState['status'],
    timestamp: typeof comp.timestamp === 'number' ? comp.timestamp : undefined,
    props: sanitizedProps
  };
}

function sanitizeProps(props: unknown): Record<string, unknown> {
  if (!props || typeof props !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    // Only allow safe property names
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized;
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    // Basic HTML sanitization (use a proper library for production)
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    return sanitizeProps(value);
  }

  return String(value);
}
```

### Safe Dynamic Compilation

```tsx
// ✅ Good: Safe compilation with restrictions
class SafeCompiler {
  private static readonly ALLOWED_GLOBALS = new Set([
    'console', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Math'
  ]);

  private static readonly RESTRICTED_PATTERNS = [
    /eval\s*\(/,
    /Function\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
    /import\s*\(/,
    /require\s*\(/,
    /process\./,
    /global\./,
    /window\./,
    /document\./
  ];

  static validateCode(code: string): void {
    for (const pattern of this.RESTRICTED_PATTERNS) {
      if (pattern.test(code)) {
        throw new Error(`Unsafe code detected: ${pattern.source}`);
      }
    }
  }

  static createSafeContext(): Record<string, unknown> {
    const context: Record<string, unknown> = {};
    
    for (const global of this.ALLOWED_GLOBALS) {
      if (global in window) {
        context[global] = (window as any)[global];
      }
    }

    return context;
  }

  static compileInSafeContext(code: string, context: Record<string, unknown> = {}) {
    this.validateCode(code);
    
    const safeContext = {
      ...this.createSafeContext(),
      ...context
    };

    // Create isolated execution context
    const contextKeys = Object.keys(safeContext);
    const contextValues = Object.values(safeContext);

    try {
      const fn = new Function(...contextKeys, `"use strict"; ${code}`);
      return fn.apply(null, contextValues);
    } catch (error) {
      throw new Error(`Compilation failed: ${error.message}`);
    }
  }
}
```

## ❌ Common Pitfalls

### 1. Memory Leaks

```tsx
// ❌ Bad: Memory leaks from uncleared timers and listeners
function BadComponent() {
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Timer running');
    }, 1000);
    
    const listener = () => console.log('Event');
    window.addEventListener('resize', listener);
    
    // Missing cleanup!
  }, []);

  return <div>Component</div>;
}

// ✅ Good: Proper cleanup
function GoodComponent() {
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Timer running');
    }, 1000);
    
    const listener = () => console.log('Event');
    window.addEventListener('resize', listener);
    
    // Proper cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', listener);
    };
  }, []);

  return <div>Component</div>;
}
```

### 2. Infinite Re-renders

```tsx
// ❌ Bad: Missing dependencies cause infinite loops
function BadComponent({ data }: { data: any[] }) {
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    setProcessedData(data.map(item => ({ ...item, processed: true })));
  }); // Missing dependency array

  return <div>{/* render */}</div>;
}

// ✅ Good: Proper dependency management
function GoodComponent({ data }: { data: any[] }) {
  const processedData = useMemo(() => 
    data.map(item => ({ ...item, processed: true }))
  , [data]);

  return <div>{/* render */}</div>;
}
```

### 3. Prop Drilling

```tsx
// ❌ Bad: Deep prop drilling
function App() {
  const [selectedId, setSelectedId] = useState(null);
  return (
    <Layout 
      selectedId={selectedId} 
      onSelect={setSelectedId}
    />
  );
}

function Layout({ selectedId, onSelect }) {
  return (
    <Sidebar selectedId={selectedId} onSelect={onSelect} />
  );
}

function Sidebar({ selectedId, onSelect }) {
  return (
    <ComponentList selectedId={selectedId} onSelect={onSelect} />
  );
}

// ✅ Good: Context for shared state
const SelectionContext = createContext(null);

function App() {
  const [selectedId, setSelectedId] = useState(null);
  
  return (
    <SelectionContext.Provider value={{ selectedId, setSelectedId }}>
      <Layout />
    </SelectionContext.Provider>
  );
}

function ComponentList() {
  const { selectedId, setSelectedId } = useContext(SelectionContext);
  // Use context directly
}
```

### 4. Unnecessary Re-renders

```tsx
// ❌ Bad: Creating objects/functions in render
function BadParent({ children }) {
  return (
    <div>
      {children.map(child => (
        <Child 
          key={child.id}
          config={{ theme: 'dark', size: 'large' }} // New object every render
          onClick={() => console.log(child.id)} // New function every render
        />
      ))}
    </div>
  );
}

// ✅ Good: Stable references
function GoodParent({ children }) {
  const config = useMemo(() => ({ theme: 'dark', size: 'large' }), []);
  
  const handleClick = useCallback((id: string) => {
    console.log(id);
  }, []);

  return (
    <div>
      {children.map(child => (
        <Child 
          key={child.id}
          config={config}
          onClick={() => handleClick(child.id)}
        />
      ))}
    </div>
  );
}
```

---

Following these best practices will help you build maintainable, performant, and secure applications with the Component Rendering System. Remember to regularly review and refactor your code to maintain high quality standards. 