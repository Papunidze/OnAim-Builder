# Basic Usage Examples

This guide provides simple, practical examples to get you started with the Component Rendering System.

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Basic Component Rendering](#basic-component-rendering)
- [Mobile/Desktop Views](#mobiledesktop-views)
- [Property Management](#property-management)
- [Error Handling](#error-handling)
- [Common Patterns](#common-patterns)

## 🚀 Getting Started

### Installation

```bash
# Install the required dependencies
npm install react react-dom typescript

# If using with existing project, ensure these are in your package.json
```

### Basic Setup

```tsx
// App.tsx
import React from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';
import { BuilderProvider } from '@app-shared/services/builder';

function App() {
  return (
    <BuilderProvider>
      <div className="app">
        <h1>My Component Builder</h1>
        <BasicExample />
      </div>
    </BuilderProvider>
  );
}

export default App;
```

## 🧩 Basic Component Rendering

### Example 1: Rendering Static Components

```tsx
// BasicExample.tsx
import React from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function BasicExample() {
  // Define your components
  const components = [
    {
      id: 'header-1',
      name: 'Header',
      status: 'loaded' as const,
      props: {
        title: 'Welcome to My App',
        subtitle: 'This is a basic example'
      }
    },
    {
      id: 'button-1', 
      name: 'Button',
      status: 'loaded' as const,
      props: {
        text: 'Click Me',
        variant: 'primary',
        size: 'large'
      }
    },
    {
      id: 'card-1',
      name: 'Card',
      status: 'loaded' as const,
      props: {
        title: 'Example Card',
        content: 'This card shows how components are rendered.',
        image: '/example-image.jpg'
      }
    }
  ];

  return (
    <div className="basic-example">
      <h2>Basic Component Rendering</h2>
      <ContentRenderer 
        components={components}
        viewMode="desktop"
      />
    </div>
  );
}

export default BasicExample;
```

### Example 2: Dynamic Component Loading

```tsx
// DynamicExample.tsx
import React, { useState, useEffect } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function DynamicExample() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading components from an API
    const loadComponents = async () => {
      try {
        // This would typically be an API call
        const response = await fetch('/api/components');
        const data = await response.json();
        
        setComponents(data.map(comp => ({
          ...comp,
          status: 'idle' // Will trigger loading
        })));
      } catch (error) {
        console.error('Failed to load components:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComponents();
  }, []);

  if (loading) {
    return <div>Loading components...</div>;
  }

  return (
    <div className="dynamic-example">
      <h2>Dynamic Component Loading</h2>
      <ContentRenderer 
        components={components}
        viewMode="desktop"
      />
    </div>
  );
}

export default DynamicExample;
```

## 📱 Mobile/Desktop Views

### Example 3: View Mode Switching

```tsx
// ViewModeExample.tsx
import React, { useState } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function ViewModeExample() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const components = [
    {
      id: 'responsive-header',
      name: 'ResponsiveHeader',
      status: 'loaded' as const,
      props: {
        title: 'Responsive Design',
        mobileTitle: 'Mobile View', // Mobile-specific prop
      }
    },
    {
      id: 'responsive-grid',
      name: 'Grid',
      status: 'loaded' as const,
      props: {
        columns: 3, // Desktop: 3 columns
        mobileColumns: 1, // Mobile: 1 column
        items: [
          { id: 1, title: 'Item 1', content: 'Content 1' },
          { id: 2, title: 'Item 2', content: 'Content 2' },
          { id: 3, title: 'Item 3', content: 'Content 3' }
        ]
      }
    }
  ];

  return (
    <div className="view-mode-example">
      {/* View Mode Toggle */}
      <div className="view-mode-controls">
        <h2>View Mode Example</h2>
        <div className="toggle-buttons">
          <button 
            className={viewMode === 'desktop' ? 'active' : ''}
            onClick={() => setViewMode('desktop')}
          >
            🖥️ Desktop
          </button>
          <button 
            className={viewMode === 'mobile' ? 'active' : ''}
            onClick={() => setViewMode('mobile')}
          >
            📱 Mobile
          </button>
        </div>
      </div>

      {/* Render components with current view mode */}
      <div className={`preview-area ${viewMode}`}>
        <ContentRenderer 
          components={components}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}

export default ViewModeExample;
```

### Example 4: Using Builder Context

```tsx
// BuilderContextExample.tsx
import React from 'react';
import { useBuilder } from '@app-shared/services/builder';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function BuilderContextExample() {
  const { 
    components, 
    viewMode, 
    setViewMode,
    selectedComponentId,
    selectComponent 
  } = useBuilder();

  return (
    <div className="builder-context-example">
      <div className="sidebar">
        <h3>Components</h3>
        {components.map(component => (
          <div 
            key={component.id}
            className={`component-item ${
              selectedComponentId === component.id ? 'selected' : ''
            }`}
            onClick={() => selectComponent(component.id)}
          >
            {component.name}
          </div>
        ))}
        
        <div className="view-controls">
          <h3>View Mode</h3>
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as 'desktop' | 'mobile')}
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>
      </div>

      <div className="main-area">
        <ContentRenderer 
          components={components}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}

export default BuilderContextExample;
```

## ⚙️ Property Management

### Example 5: Component Property Editor

```tsx
// PropertyEditorExample.tsx
import React, { useState } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function PropertyEditorExample() {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [components, setComponents] = useState([
    {
      id: 'editable-button',
      name: 'Button',
      status: 'loaded' as const,
      props: {
        text: 'Edit Me',
        color: '#007bff',
        size: 'medium',
        disabled: false
      }
    },
    {
      id: 'editable-text',
      name: 'Text',
      status: 'loaded' as const,
      props: {
        content: 'This text can be edited',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#333333'
      }
    }
  ]);

  const updateComponentProp = (componentId: string, propKey: string, value: any) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId 
        ? { ...comp, props: { ...comp.props, [propKey]: value } }
        : comp
    ));
  };

  return (
    <div className="property-editor-example">
      <div className="editor-layout">
        {/* Property Editor Panel */}
        <div className="property-panel">
          <h3>Property Editor</h3>
          
          {/* Component Selector */}
          <div className="component-selector">
            <label>Select Component:</label>
            <select 
              onChange={(e) => setSelectedComponent(e.target.value)}
              value={selectedComponent || ''}
            >
              <option value="">Choose a component</option>
              {components.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} ({comp.id})
                </option>
              ))}
            </select>
          </div>

          {/* Property Editors */}
          {selectedComponent && (() => {
            const component = components.find(c => c.id === selectedComponent);
            if (!component) return null;

            return (
              <div className="properties">
                <h4>{component.name} Properties</h4>
                {Object.entries(component.props).map(([key, value]) => (
                  <div key={key} className="property-field">
                    <label>{key}:</label>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateComponentProp(
                          component.id, 
                          key, 
                          e.target.checked
                        )}
                      />
                    ) : typeof value === 'number' ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => updateComponentProp(
                          component.id, 
                          key, 
                          parseInt(e.target.value)
                        )}
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => updateComponentProp(
                          component.id, 
                          key, 
                          e.target.value
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Preview Area */}
        <div className="preview-area">
          <h3>Live Preview</h3>
          <ContentRenderer 
            components={components}
            viewMode="desktop"
          />
        </div>
      </div>
    </div>
  );
}

export default PropertyEditorExample;
```

## 🚨 Error Handling

### Example 6: Error Boundaries and Recovery

```tsx
// ErrorHandlingExample.tsx
import React, { useState } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function ErrorHandlingExample() {
  const [components, setComponents] = useState([
    {
      id: 'working-component',
      name: 'WorkingComponent',
      status: 'loaded' as const,
      props: { message: 'This component works fine' }
    },
    {
      id: 'error-component',
      name: 'NonExistentComponent', // This will cause an error
      status: 'idle' as const,
      props: { message: 'This will fail to load' }
    },
    {
      id: 'another-working',
      name: 'AnotherComponent',
      status: 'loaded' as const,
      props: { message: 'This also works' }
    }
  ]);

  const retryFailedComponents = () => {
    setComponents(prev => prev.map(comp => 
      comp.status === 'error' 
        ? { ...comp, status: 'idle' as const, retryCount: 0 }
        : comp
    ));
  };

  const simulateError = () => {
    setComponents(prev => prev.map(comp => 
      comp.id === 'working-component'
        ? { ...comp, name: 'BrokenComponent' } // Change to non-existent component
        : comp
    ));
  };

  const fixErrors = () => {
    setComponents(prev => prev.map(comp => ({
      ...comp,
      name: comp.name.includes('Broken') ? 'WorkingComponent' : comp.name,
      status: 'idle' as const
    })));
  };

  return (
    <div className="error-handling-example">
      <div className="controls">
        <h2>Error Handling Example</h2>
        <div className="button-group">
          <button onClick={retryFailedComponents}>
            Retry Failed Components
          </button>
          <button onClick={simulateError}>
            Simulate Error
          </button>
          <button onClick={fixErrors}>
            Fix All Errors
          </button>
        </div>
      </div>

      <div className="content-area">
        <ContentRenderer 
          components={components}
          viewMode="desktop"
        />
      </div>

      {/* Error Summary */}
      <div className="error-summary">
        <h3>Component Status</h3>
        {components.map(comp => (
          <div key={comp.id} className={`status-item ${comp.status}`}>
            <span className="component-name">{comp.name}</span>
            <span className="status-badge">{comp.status}</span>
            {comp.status === 'error' && (
              <span className="retry-count">
                (Retries: {comp.retryCount || 0}/3)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ErrorHandlingExample;
```

## 🔄 Common Patterns

### Example 7: Loading States

```tsx
// LoadingStatesExample.tsx
import React, { useState, useEffect } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

function LoadingStatesExample() {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate staggered component loading
    const loadComponentsSequentially = async () => {
      const componentConfigs = [
        { id: 'comp-1', name: 'Header', delay: 500 },
        { id: 'comp-2', name: 'Navigation', delay: 1000 },
        { id: 'comp-3', name: 'Content', delay: 1500 },
        { id: 'comp-4', name: 'Footer', delay: 2000 }
      ];

      // Add components with 'idle' status initially
      setComponents(componentConfigs.map(config => ({
        id: config.id,
        name: config.name,
        status: 'idle' as const,
        props: { message: `Loading ${config.name}...` }
      })));

      setIsLoading(false);

      // Simulate individual component loading
      for (const config of componentConfigs) {
        setTimeout(() => {
          setComponents(prev => prev.map(comp =>
            comp.id === config.id
              ? { ...comp, status: 'loaded' as const, props: { message: `${config.name} loaded!` } }
              : comp
          ));
        }, config.delay);
      }
    };

    loadComponentsSequentially();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-example">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Initializing components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-states-example">
      <h2>Loading States Example</h2>
      <p>Watch as components load sequentially:</p>
      
      <ContentRenderer 
        components={components}
        viewMode="desktop"
      />
      
      {/* Loading Progress */}
      <div className="loading-progress">
        <h3>Loading Progress</h3>
        {components.map(comp => (
          <div key={comp.id} className="progress-item">
            <span>{comp.name}</span>
            <span className={`status ${comp.status}`}>
              {comp.status === 'idle' && '⏳ Waiting'}
              {comp.status === 'loading' && '🔄 Loading'}
              {comp.status === 'loaded' && '✅ Loaded'}
              {comp.status === 'error' && '❌ Error'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingStatesExample;
```

### Example 8: Custom Hooks Integration

```tsx
// CustomHooksExample.tsx
import React from 'react';
import { useComponentInstances } from '@app-features/builder/ui/content-renderer/hooks';
import { ComponentInstance } from '@app-features/builder/ui/content-renderer';

// Custom hook for component management
function useComponentManager(initialComponents) {
  const { instances, aggregatedStyles, retryComponent, isPending } = 
    useComponentInstances(initialComponents, { maxRetryCount: 5 });

  const getComponentStats = () => {
    const stats = instances.reduce((acc, instance) => {
      acc[instance.status] = (acc[instance.status] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const retryAllFailed = () => {
    instances
      .filter(instance => instance.status === 'error')
      .forEach(instance => retryComponent(instance.id));
  };

  return {
    instances,
    aggregatedStyles,
    retryComponent,
    isPending,
    stats: getComponentStats(),
    retryAllFailed
  };
}

function CustomHooksExample() {
  const components = [
    { id: 'hook-comp-1', name: 'CustomComponent1', status: 'idle' as const },
    { id: 'hook-comp-2', name: 'CustomComponent2', status: 'idle' as const },
    { id: 'hook-comp-3', name: 'FailingComponent', status: 'idle' as const }
  ];

  const {
    instances,
    aggregatedStyles,
    retryComponent,
    isPending,
    stats,
    retryAllFailed
  } = useComponentManager(components);

  return (
    <div className="custom-hooks-example">
      <div className="header">
        <h2>Custom Hooks Example</h2>
        
        {/* Statistics */}
        <div className="stats">
          <h3>Component Statistics</h3>
          {Object.entries(stats).map(([status, count]) => (
            <span key={status} className={`stat-badge ${status}`}>
              {status}: {count}
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="controls">
          {isPending && <span className="loading-indicator">⏳ Loading...</span>}
          {stats.error > 0 && (
            <button onClick={retryAllFailed}>
              Retry All Failed ({stats.error})
            </button>
          )}
        </div>
      </div>

      {/* Aggregated Styles */}
      {aggregatedStyles && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyles }} />
      )}

      {/* Component Instances */}
      <div className="component-list">
        {instances.map(instance => (
          <div key={instance.id} className="component-wrapper">
            <div className="component-header">
              <h4>{instance.name}</h4>
              <span className={`status-badge ${instance.status}`}>
                {instance.status}
              </span>
            </div>
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

export default CustomHooksExample;
```

## 🎨 Styling

### CSS for Examples

```css
/* Basic styling for examples */
.basic-example,
.dynamic-example,
.view-mode-example,
.property-editor-example,
.error-handling-example,
.loading-states-example,
.custom-hooks-example {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.view-mode-controls {
  margin-bottom: 20px;
}

.toggle-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.toggle-buttons button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
}

.toggle-buttons button.active {
  background: #007bff;
  color: white;
}

.preview-area.mobile {
  max-width: 375px;
  margin: 0 auto;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 20px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.property-panel {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
}

.property-field {
  margin-bottom: 15px;
}

.property-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.property-field input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.loaded { background: #d4edda; color: #155724; }
.status-badge.loading { background: #fff3cd; color: #856404; }
.status-badge.error { background: #f8d7da; color: #721c24; }
.status-badge.idle { background: #e2e3e5; color: #383d41; }
```

---

These basic examples provide a solid foundation for understanding how to use the Component Rendering System. Each example builds on the previous ones, demonstrating progressively more advanced features while maintaining simplicity and clarity. 