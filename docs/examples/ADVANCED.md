# Advanced Usage Examples

This guide showcases advanced patterns, optimization techniques, and enterprise-level implementations of the Component Rendering System.

## 📚 Table of Contents

- [Advanced Patterns](#advanced-patterns)
- [Performance Optimization](#performance-optimization)
- [Custom Renderers](#custom-renderers)
- [Plugin System](#plugin-system)
- [State Management Integration](#state-management-integration)
- [Testing Strategies](#testing-strategies)

## 🏗️ Advanced Patterns

### Example 1: Nested Component Hierarchy

```tsx
// NestedComponentsExample.tsx
import React, { useState, useMemo } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

interface ComponentNode {
  id: string;
  name: string;
  props?: Record<string, unknown>;
  children?: ComponentNode[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
}

function NestedComponentsExample() {
  const [componentTree, setComponentTree] = useState<ComponentNode>({
    id: 'root',
    name: 'Layout',
    status: 'loaded',
    props: { className: 'main-layout' },
    children: [
      {
        id: 'header',
        name: 'Header',
        status: 'loaded',
        props: { title: 'Advanced Example' },
        children: [
          {
            id: 'nav',
            name: 'Navigation',
            status: 'loaded',
            props: { items: ['Home', 'About', 'Contact'] }
          }
        ]
      },
      {
        id: 'content',
        name: 'ContentArea',
        status: 'loaded',
        props: { maxWidth: '1200px' },
        children: [
          {
            id: 'sidebar',
            name: 'Sidebar',
            status: 'loaded',
            props: { width: '300px' }
          },
          {
            id: 'main',
            name: 'MainContent',
            status: 'loaded',
            props: { flex: 1 },
            children: [
              {
                id: 'article-1',
                name: 'Article',
                status: 'loaded',
                props: { title: 'Article 1', content: 'Content...' }
              },
              {
                id: 'article-2',
                name: 'Article', 
                status: 'loaded',
                props: { title: 'Article 2', content: 'More content...' }
              }
            ]
          }
        ]
      },
      {
        id: 'footer',
        name: 'Footer',
        status: 'loaded',
        props: { year: 2024 }
      }
    ]
  });

  // Flatten tree structure for ContentRenderer
  const flattenedComponents = useMemo(() => {
    const flatten = (node: ComponentNode, parentId?: string): any[] => {
      const component = {
        id: node.id,
        name: node.name,
        status: node.status,
        props: {
          ...node.props,
          parentId,
          children: node.children?.map(child => child.id) || []
        }
      };

      const childComponents = node.children?.flatMap(child => 
        flatten(child, node.id)
      ) || [];

      return [component, ...childComponents];
    };

    return flatten(componentTree);
  }, [componentTree]);

  // Update component in tree
  const updateComponent = (id: string, updates: Partial<ComponentNode>) => {
    const updateNode = (node: ComponentNode): ComponentNode => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNode)
        };
      }
      
      return node;
    };

    setComponentTree(updateNode);
  };

  return (
    <div className="nested-components-example">
      <div className="tree-controls">
        <h2>Nested Component Hierarchy</h2>
        <ComponentTreeView 
          node={componentTree} 
          onUpdate={updateComponent}
        />
      </div>

      <div className="preview-area">
        <ContentRenderer 
          components={flattenedComponents}
          viewMode="desktop"
        />
      </div>
    </div>
  );
}

// Tree visualization component
function ComponentTreeView({ 
  node, 
  onUpdate,
  level = 0 
}: {
  node: ComponentNode;
  onUpdate: (id: string, updates: Partial<ComponentNode>) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="tree-node" style={{ marginLeft: level * 20 }}>
      <div className="node-header">
        {node.children && (
          <button 
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </button>
        )}
        
        <span className="node-name">{node.name}</span>
        <span className={`node-status ${node.status}`}>
          {node.status}
        </span>
        
        <button
          className="reload-btn"
          onClick={() => onUpdate(node.id, { status: 'loading' })}
        >
          ↻
        </button>
      </div>

      {expanded && node.children && (
        <div className="node-children">
          {node.children.map(child => (
            <ComponentTreeView
              key={child.id}
              node={child}
              onUpdate={onUpdate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NestedComponentsExample;
```

### Example 2: Conditional Component Rendering

```tsx
// ConditionalRenderingExample.tsx
import React, { useState, useMemo } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

interface RenderCondition {
  type: 'user_role' | 'feature_flag' | 'device' | 'time' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  field?: string;
}

interface ConditionalComponent {
  id: string;
  name: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  props?: Record<string, unknown>;
  conditions?: RenderCondition[];
}

function ConditionalRenderingExample() {
  // Simulation context
  const [context, setContext] = useState({
    userRole: 'admin',
    featureFlags: ['new_ui', 'analytics'],
    device: 'desktop',
    time: new Date().getHours()
  });

  const conditionalComponents: ConditionalComponent[] = [
    {
      id: 'admin-panel',
      name: 'AdminPanel',
      status: 'loaded',
      props: { title: 'Admin Controls' },
      conditions: [
        { type: 'user_role', operator: 'equals', value: 'admin' }
      ]
    },
    {
      id: 'analytics-widget',
      name: 'AnalyticsWidget',
      status: 'loaded',
      props: { dashboard: 'main' },
      conditions: [
        { type: 'feature_flag', operator: 'contains', value: 'analytics' }
      ]
    },
    {
      id: 'mobile-menu',
      name: 'MobileMenu',
      status: 'loaded',
      props: { collapsed: true },
      conditions: [
        { type: 'device', operator: 'equals', value: 'mobile' }
      ]
    },
    {
      id: 'business-hours',
      name: 'BusinessHoursNotice',
      status: 'loaded',
      props: { message: 'We are currently open!' },
      conditions: [
        { type: 'time', operator: 'greater_than', value: 9 },
        { type: 'time', operator: 'less_than', value: 17 }
      ]
    },
    {
      id: 'always-visible',
      name: 'Header',
      status: 'loaded',
      props: { title: 'Always Visible' }
    }
  ];

  // Evaluate conditions
  const evaluateCondition = (condition: RenderCondition): boolean => {
    let contextValue: any;

    switch (condition.type) {
      case 'user_role':
        contextValue = context.userRole;
        break;
      case 'feature_flag':
        contextValue = context.featureFlags;
        break;
      case 'device':
        contextValue = context.device;
        break;
      case 'time':
        contextValue = context.time;
        break;
      case 'custom':
        contextValue = (context as any)[condition.field!];
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'contains':
        return Array.isArray(contextValue) 
          ? contextValue.includes(condition.value)
          : String(contextValue).includes(condition.value);
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      default:
        return false;
    }
  };

  const evaluateAllConditions = (conditions: RenderCondition[] = []): boolean => {
    if (conditions.length === 0) return true;
    return conditions.every(evaluateCondition);
  };

  // Filter components based on conditions
  const visibleComponents = useMemo(() => {
    return conditionalComponents.filter(component => 
      evaluateAllConditions(component.conditions)
    );
  }, [context, conditionalComponents]);

  return (
    <div className="conditional-rendering-example">
      <div className="context-controls">
        <h2>Conditional Component Rendering</h2>
        
        <div className="context-editor">
          <h3>Context Variables</h3>
          
          <div className="control-group">
            <label>User Role:</label>
            <select 
              value={context.userRole}
              onChange={(e) => setContext(prev => ({ 
                ...prev, 
                userRole: e.target.value 
              }))}
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div className="control-group">
            <label>Device:</label>
            <select 
              value={context.device}
              onChange={(e) => setContext(prev => ({ 
                ...prev, 
                device: e.target.value 
              }))}
            >
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          <div className="control-group">
            <label>Time (Hour):</label>
            <input 
              type="number"
              min="0"
              max="23"
              value={context.time}
              onChange={(e) => setContext(prev => ({ 
                ...prev, 
                time: parseInt(e.target.value) 
              }))}
            />
          </div>

          <div className="control-group">
            <label>Feature Flags:</label>
            <div className="checkbox-group">
              {['new_ui', 'analytics', 'beta_features'].map(flag => (
                <label key={flag}>
                  <input
                    type="checkbox"
                    checked={context.featureFlags.includes(flag)}
                    onChange={(e) => {
                      setContext(prev => ({
                        ...prev,
                        featureFlags: e.target.checked
                          ? [...prev.featureFlags, flag]
                          : prev.featureFlags.filter(f => f !== flag)
                      }));
                    }}
                  />
                  {flag}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="component-status">
          <h3>Component Visibility</h3>
          {conditionalComponents.map(comp => (
            <div key={comp.id} className="status-item">
              <span className="component-name">{comp.name}</span>
              <span className={`visibility-badge ${
                visibleComponents.some(v => v.id === comp.id) ? 'visible' : 'hidden'
              }`}>
                {visibleComponents.some(v => v.id === comp.id) ? '👁️ Visible' : '🚫 Hidden'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="preview-area">
        <h3>Rendered Components</h3>
        <ContentRenderer 
          components={visibleComponents}
          viewMode="desktop"
        />
      </div>
    </div>
  );
}

export default ConditionalRenderingExample;
```

## ⚡ Performance Optimization

### Example 3: Virtual Scrolling Implementation

```tsx
// VirtualScrollingExample.tsx
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ComponentInstance } from '@app-features/builder/ui/content-renderer';
import { useComponentInstances } from '@app-features/builder/ui/content-renderer/hooks';

function VirtualScrollingExample() {
  const [componentCount, setComponentCount] = useState(1000);
  const [itemHeight, setItemHeight] = useState(120);
  const [visibleCount, setVisibleCount] = useState(10);

  // Generate large number of components
  const components = useMemo(() => 
    Array.from({ length: componentCount }, (_, index) => ({
      id: `virtual-component-${index}`,
      name: `Component${index % 5}`, // Cycle through 5 component types
      status: 'loaded' as const,
      props: {
        index,
        title: `Component ${index}`,
        content: `This is dynamically generated content for component ${index}`,
        timestamp: Date.now() + index
      }
    }))
  , [componentCount]);

  const { instances, retryComponent } = useComponentInstances(components);

  // Virtualized Row Component
  const VirtualizedRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const instance = instances[index];
    
    if (!instance) {
      return (
        <div style={style} className="virtual-row loading">
          <div className="loading-placeholder">Loading component {index}...</div>
        </div>
      );
    }

    return (
      <div style={style} className="virtual-row">
        <div className="row-header">
          <span className="row-index">#{index}</span>
          <span className="component-name">{instance.name}</span>
          <span className={`status-indicator ${instance.status}`}>
            {instance.status}
          </span>
        </div>
        <div className="row-content">
          <ComponentInstance 
            instance={instance}
            onRetry={retryComponent}
          />
        </div>
      </div>
    );
  }, [instances, retryComponent]);

  // Performance metrics
  const [renderMetrics, setRenderMetrics] = useState({
    totalComponents: 0,
    renderedComponents: 0,
    renderTime: 0
  });

  const updateMetrics = useCallback(() => {
    const start = performance.now();
    
    // Simulate metrics calculation
    setTimeout(() => {
      const end = performance.now();
      setRenderMetrics({
        totalComponents: components.length,
        renderedComponents: Math.min(visibleCount, components.length),
        renderTime: end - start
      });
    }, 0);
  }, [components.length, visibleCount]);

  return (
    <div className="virtual-scrolling-example">
      <div className="controls-panel">
        <h2>Virtual Scrolling Example</h2>
        
        <div className="controls-grid">
          <div className="control-group">
            <label>Total Components:</label>
            <input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={componentCount}
              onChange={(e) => setComponentCount(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Item Height:</label>
            <input
              type="number"
              min="80"
              max="200"
              value={itemHeight}
              onChange={(e) => setItemHeight(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Visible Items:</label>
            <input
              type="number"
              min="5"
              max="50"
              value={visibleCount}
              onChange={(e) => setVisibleCount(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="metrics-panel">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Total Components:</span>
              <span className="metric-value">{renderMetrics.totalComponents.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Rendered:</span>
              <span className="metric-value">{renderMetrics.renderedComponents}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Render Time:</span>
              <span className="metric-value">{renderMetrics.renderTime.toFixed(2)}ms</span>
            </div>
          </div>
        </div>

        <button onClick={updateMetrics} className="update-metrics-btn">
          Update Metrics
        </button>
      </div>

      <div className="virtual-list-container">
        <h3>Virtualized Component List</h3>
        <div className="list-wrapper">
          <List
            height={visibleCount * itemHeight}
            itemCount={instances.length}
            itemSize={itemHeight}
            width="100%"
            className="virtual-list"
          >
            {VirtualizedRow}
          </List>
        </div>
      </div>
    </div>
  );
}

export default VirtualScrollingExample;
```

### Example 4: Lazy Loading with Intersection Observer

```tsx
// LazyLoadingExample.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComponentInstance } from '@app-features/builder/ui/content-renderer';

interface LazyComponentProps {
  instance: any;
  onRetry: (id: string) => void;
  threshold?: number;
  rootMargin?: string;
}

function LazyComponent({ 
  instance, 
  onRetry, 
  threshold = 0.1, 
  rootMargin = '50px' 
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  // Placeholder dimensions
  const placeholderHeight = instance.estimatedHeight || 200;

  return (
    <div 
      ref={elementRef}
      className={`lazy-component ${isVisible ? 'loaded' : 'loading'}`}
      style={{ minHeight: placeholderHeight }}
    >
      {isVisible ? (
        <ComponentInstance 
          instance={instance}
          onRetry={onRetry}
        />
      ) : (
        <div className="lazy-placeholder">
          <div className="placeholder-content">
            <div className="skeleton-loader">
              <div className="skeleton-header"></div>
              <div className="skeleton-body"></div>
              <div className="skeleton-footer"></div>
            </div>
            <span className="loading-text">Loading {instance.name}...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LazyLoadingExample() {
  const [loadingStrategy, setLoadingStrategy] = useState<'immediate' | 'lazy' | 'progressive'>('lazy');
  const [batchSize, setBatchSize] = useState(5);

  // Generate components with different estimated heights
  const components = Array.from({ length: 50 }, (_, index) => ({
    id: `lazy-${index}`,
    name: `LazyComponent${index % 3}`,
    status: 'idle' as const,
    estimatedHeight: 150 + (index % 4) * 50, // Vary heights
    props: {
      index,
      title: `Lazy Component ${index}`,
      description: `This component loads lazily when it enters the viewport. Index: ${index}`,
      priority: index < 10 ? 'high' : 'normal'
    }
  }));

  const [visibleComponents, setVisibleComponents] = useState<typeof components>([]);

  // Progressive loading logic
  useEffect(() => {
    if (loadingStrategy === 'immediate') {
      setVisibleComponents(components);
    } else if (loadingStrategy === 'progressive') {
      let currentBatch = 0;
      setVisibleComponents([]);

      const loadNextBatch = () => {
        const startIndex = currentBatch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, components.length);
        
        if (startIndex < components.length) {
          setVisibleComponents(prev => [
            ...prev,
            ...components.slice(startIndex, endIndex)
          ]);
          currentBatch++;
          
          // Load next batch after delay
          setTimeout(loadNextBatch, 1000);
        }
      };

      loadNextBatch();
    } else {
      setVisibleComponents(components);
    }
  }, [loadingStrategy, batchSize]);

  const retryComponent = useCallback((id: string) => {
    setVisibleComponents(prev => 
      prev.map(comp => 
        comp.id === id 
          ? { ...comp, status: 'idle' as const }
          : comp
      )
    );
  }, []);

  return (
    <div className="lazy-loading-example">
      <div className="controls-header">
        <h2>Lazy Loading Example</h2>
        
        <div className="loading-controls">
          <div className="control-group">
            <label>Loading Strategy:</label>
            <select 
              value={loadingStrategy}
              onChange={(e) => setLoadingStrategy(e.target.value as any)}
            >
              <option value="immediate">Immediate</option>
              <option value="lazy">Lazy (Intersection Observer)</option>
              <option value="progressive">Progressive (Batched)</option>
            </select>
          </div>

          {loadingStrategy === 'progressive' && (
            <div className="control-group">
              <label>Batch Size:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="loading-stats">
          <span>Total Components: {components.length}</span>
          <span>Visible Components: {visibleComponents.length}</span>
          <span>Strategy: {loadingStrategy}</span>
        </div>
      </div>

      <div className="components-container">
        {loadingStrategy === 'lazy' ? (
          // Use lazy loading components
          visibleComponents.map(component => (
            <LazyComponent
              key={component.id}
              instance={component}
              onRetry={retryComponent}
              threshold={0.1}
              rootMargin="100px"
            />
          ))
        ) : (
          // Standard rendering
          visibleComponents.map(component => (
            <div key={component.id} className="standard-component">
              <ComponentInstance 
                instance={component}
                onRetry={retryComponent}
              />
            </div>
          ))
        )}

        {loadingStrategy === 'progressive' && visibleComponents.length < components.length && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <span>Loading more components...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LazyLoadingExample;
```

## 🎨 Custom Renderers

### Example 5: Grid-Based Component Renderer

```tsx
// GridRendererExample.tsx
import React, { useState, useMemo } from 'react';
import { useComponentInstances } from '@app-features/builder/ui/content-renderer/hooks';
import { ComponentInstance } from '@app-features/builder/ui/content-renderer';

interface GridLayout {
  columns: number;
  gap: number;
  autoFit: boolean;
  minColumnWidth: number;
}

interface GridComponent {
  id: string;
  name: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  props?: Record<string, unknown>;
  gridArea?: {
    row?: string;
    column?: string;
    rowSpan?: number;
    columnSpan?: number;
  };
}

function GridRenderer({ 
  components, 
  layout,
  onRetry 
}: {
  components: GridComponent[];
  layout: GridLayout;
  onRetry: (id: string) => void;
}) {
  const gridStyle = useMemo(() => {
    if (layout.autoFit) {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${layout.minColumnWidth}px, 1fr))`,
        gap: `${layout.gap}px`,
        width: '100%'
      };
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
      gap: `${layout.gap}px`,
      width: '100%'
    };
  }, [layout]);

  return (
    <div className="grid-renderer" style={gridStyle}>
      {components.map(component => {
        const itemStyle: React.CSSProperties = {};
        
        if (component.gridArea) {
          const { row, column, rowSpan, columnSpan } = component.gridArea;
          
          if (row) itemStyle.gridRow = row;
          if (column) itemStyle.gridColumn = column;
          if (rowSpan) itemStyle.gridRowEnd = `span ${rowSpan}`;
          if (columnSpan) itemStyle.gridColumnEnd = `span ${columnSpan}`;
        }

        return (
          <div 
            key={component.id}
            className="grid-item"
            style={itemStyle}
          >
            <ComponentInstance 
              instance={component}
              onRetry={onRetry}
            />
          </div>
        );
      })}
    </div>
  );
}

function GridRendererExample() {
  const [layout, setLayout] = useState<GridLayout>({
    columns: 3,
    gap: 20,
    autoFit: false,
    minColumnWidth: 300
  });

  const gridComponents: GridComponent[] = [
    {
      id: 'hero',
      name: 'HeroSection',
      status: 'loaded',
      props: { title: 'Hero Section', fullWidth: true },
      gridArea: { columnSpan: 3, rowSpan: 1 }
    },
    {
      id: 'nav',
      name: 'Navigation',
      status: 'loaded',
      props: { items: ['Home', 'About', 'Services', 'Contact'] },
      gridArea: { columnSpan: 3 }
    },
    {
      id: 'sidebar',
      name: 'Sidebar',
      status: 'loaded',
      props: { width: '100%' },
      gridArea: { rowSpan: 3 }
    },
    {
      id: 'content-1',
      name: 'ContentBlock',
      status: 'loaded',
      props: { title: 'Main Content', content: 'Primary content area' },
      gridArea: { columnSpan: 2 }
    },
    {
      id: 'content-2',
      name: 'ContentBlock',
      status: 'loaded',
      props: { title: 'Secondary Content', content: 'Secondary content area' }
    },
    {
      id: 'widget-1',
      name: 'Widget',
      status: 'loaded',
      props: { type: 'stats', title: 'Statistics' }
    },
    {
      id: 'footer',
      name: 'Footer',
      status: 'loaded',
      props: { year: 2024, links: ['Privacy', 'Terms', 'Contact'] },
      gridArea: { columnSpan: 3 }
    }
  ];

  const { instances, retryComponent } = useComponentInstances(gridComponents);

  const updateLayout = (updates: Partial<GridLayout>) => {
    setLayout(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="grid-renderer-example">
      <div className="layout-controls">
        <h2>Grid-Based Component Renderer</h2>
        
        <div className="controls-panel">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={layout.autoFit}
                onChange={(e) => updateLayout({ autoFit: e.target.checked })}
              />
              Auto-fit columns
            </label>
          </div>

          {!layout.autoFit && (
            <div className="control-group">
              <label>Columns:</label>
              <input
                type="number"
                min="1"
                max="12"
                value={layout.columns}
                onChange={(e) => updateLayout({ columns: parseInt(e.target.value) })}
              />
            </div>
          )}

          {layout.autoFit && (
            <div className="control-group">
              <label>Min Column Width:</label>
              <input
                type="number"
                min="200"
                max="500"
                step="50"
                value={layout.minColumnWidth}
                onChange={(e) => updateLayout({ minColumnWidth: parseInt(e.target.value) })}
              />
            </div>
          )}

          <div className="control-group">
            <label>Gap:</label>
            <input
              type="number"
              min="0"
              max="50"
              value={layout.gap}
              onChange={(e) => updateLayout({ gap: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="layout-info">
          <h3>Layout Configuration</h3>
          <pre>{JSON.stringify(layout, null, 2)}</pre>
        </div>
      </div>

      <div className="grid-preview">
        <h3>Grid Preview</h3>
        <GridRenderer 
          components={instances}
          layout={layout}
          onRetry={retryComponent}
        />
      </div>
    </div>
  );
}

export default GridRendererExample;
```

## 🔌 Plugin System

### Example 6: Component Plugin Architecture

```tsx
// PluginSystemExample.tsx
import React, { useState, useMemo } from 'react';
import { ContentRenderer } from '@app-features/builder/ui/content-renderer';

// Plugin interface
interface ComponentPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  transforms?: {
    beforeRender?: (component: any) => any;
    afterRender?: (element: React.ReactElement) => React.ReactElement;
    onError?: (error: Error, component: any) => React.ReactElement | null;
  };
  hooks?: {
    onComponentLoad?: (component: any) => void;
    onComponentUnload?: (component: any) => void;
    onPropsChange?: (component: any, oldProps: any, newProps: any) => void;
  };
  settings?: Record<string, any>;
  enabled: boolean;
}

// Plugin registry
class PluginRegistry {
  private plugins = new Map<string, ComponentPlugin>();
  private listeners = new Set<() => void>();

  register(plugin: ComponentPlugin) {
    this.plugins.set(plugin.id, plugin);
    this.notifyListeners();
  }

  unregister(pluginId: string) {
    this.plugins.delete(pluginId);
    this.notifyListeners();
  }

  getPlugin(id: string): ComponentPlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): ComponentPlugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): ComponentPlugin[] {
    return this.getAllPlugins().filter(plugin => plugin.enabled);
  }

  updatePlugin(id: string, updates: Partial<ComponentPlugin>) {
    const plugin = this.plugins.get(id);
    if (plugin) {
      this.plugins.set(id, { ...plugin, ...updates });
      this.notifyListeners();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Create global plugin registry
const pluginRegistry = new PluginRegistry();

// Example plugins
const examplePlugins: ComponentPlugin[] = [
  {
    id: 'analytics-plugin',
    name: 'Analytics Tracker',
    version: '1.0.0',
    description: 'Tracks component render events for analytics',
    enabled: true,
    hooks: {
      onComponentLoad: (component) => {
        console.log('Analytics: Component loaded', component.name);
      },
      onComponentUnload: (component) => {
        console.log('Analytics: Component unloaded', component.name);
      }
    }
  },
  {
    id: 'error-boundary-plugin',
    name: 'Error Boundary',
    version: '1.0.0',
    description: 'Wraps components with error boundaries',
    enabled: true,
    transforms: {
      afterRender: (element) => (
        <div className="plugin-error-boundary">
          {element}
        </div>
      ),
      onError: (error, component) => (
        <div className="plugin-error-fallback">
          <h4>Plugin Error in {component.name}</h4>
          <p>{error.message}</p>
        </div>
      )
    }
  },
  {
    id: 'theme-plugin',
    name: 'Theme Provider',
    version: '1.0.0',
    description: 'Provides theme context to components',
    enabled: false,
    settings: {
      theme: 'dark',
      primaryColor: '#007bff'
    },
    transforms: {
      beforeRender: (component) => ({
        ...component,
        props: {
          ...component.props,
          theme: pluginRegistry.getPlugin('theme-plugin')?.settings?.theme
        }
      })
    }
  },
  {
    id: 'performance-plugin',
    name: 'Performance Monitor',
    version: '1.0.0',
    description: 'Monitors component render performance',
    enabled: true,
    transforms: {
      afterRender: (element) => (
        <div 
          className="performance-wrapper"
          onLoadStart={() => console.time(`render-${Date.now()}`)}
          onLoad={() => console.timeEnd(`render-${Date.now()}`)}
        >
          {element}
        </div>
      )
    }
  }
];

// Enhanced Content Renderer with Plugin Support
function PluginAwareContentRenderer({ 
  components, 
  viewMode 
}: {
  components: any[];
  viewMode: 'desktop' | 'mobile';
}) {
  const [, forceUpdate] = useState({});
  
  // Subscribe to plugin changes
  React.useEffect(() => {
    return pluginRegistry.subscribe(() => forceUpdate({}));
  }, []);

  const enhancedComponents = useMemo(() => {
    const enabledPlugins = pluginRegistry.getEnabledPlugins();
    
    return components.map(component => {
      let enhancedComponent = { ...component };
      
      // Apply beforeRender transforms
      enabledPlugins.forEach(plugin => {
        if (plugin.transforms?.beforeRender) {
          enhancedComponent = plugin.transforms.beforeRender(enhancedComponent);
        }
      });

      // Call onComponentLoad hooks
      enabledPlugins.forEach(plugin => {
        if (plugin.hooks?.onComponentLoad) {
          plugin.hooks.onComponentLoad(enhancedComponent);
        }
      });

      return enhancedComponent;
    });
  }, [components]);

  return (
    <ContentRenderer 
      components={enhancedComponents}
      viewMode={viewMode}
    />
  );
}

function PluginSystemExample() {
  const [plugins, setPlugins] = useState<ComponentPlugin[]>(examplePlugins);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);

  // Initialize plugins
  React.useEffect(() => {
    plugins.forEach(plugin => pluginRegistry.register(plugin));
    
    return () => {
      plugins.forEach(plugin => pluginRegistry.unregister(plugin.id));
    };
  }, []);

  const togglePlugin = (pluginId: string) => {
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (plugin) {
      pluginRegistry.updatePlugin(pluginId, { enabled: !plugin.enabled });
      setPlugins(pluginRegistry.getAllPlugins());
    }
  };

  const updatePluginSettings = (pluginId: string, settings: Record<string, any>) => {
    pluginRegistry.updatePlugin(pluginId, { settings });
    setPlugins(pluginRegistry.getAllPlugins());
  };

  const sampleComponents = [
    {
      id: 'plugin-test-1',
      name: 'TestComponent',
      status: 'loaded' as const,
      props: { title: 'Plugin Test Component 1' }
    },
    {
      id: 'plugin-test-2',
      name: 'TestComponent',
      status: 'loaded' as const,
      props: { title: 'Plugin Test Component 2' }
    }
  ];

  return (
    <div className="plugin-system-example">
      <div className="plugin-manager">
        <h2>Plugin System Example</h2>
        
        <div className="plugin-list">
          <h3>Available Plugins</h3>
          {plugins.map(plugin => (
            <div key={plugin.id} className={`plugin-item ${plugin.enabled ? 'enabled' : 'disabled'}`}>
              <div className="plugin-header">
                <div className="plugin-info">
                  <h4>{plugin.name}</h4>
                  <span className="plugin-version">v{plugin.version}</span>
                  <p className="plugin-description">{plugin.description}</p>
                </div>
                <div className="plugin-controls">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={plugin.enabled}
                      onChange={() => togglePlugin(plugin.id)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              
              {plugin.settings && plugin.enabled && (
                <div className="plugin-settings">
                  <h5>Settings</h5>
                  {Object.entries(plugin.settings).map(([key, value]) => (
                    <div key={key} className="setting-item">
                      <label>{key}:</label>
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => updatePluginSettings(plugin.id, {
                          ...plugin.settings,
                          [key]: e.target.value
                        })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="plugin-stats">
          <h3>Plugin Statistics</h3>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Total Plugins:</span>
              <span className="stat-value">{plugins.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Enabled:</span>
              <span className="stat-value">{plugins.filter(p => p.enabled).length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Disabled:</span>
              <span className="stat-value">{plugins.filter(p => !p.enabled).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="plugin-preview">
        <h3>Components with Plugins</h3>
        <PluginAwareContentRenderer 
          components={sampleComponents}
          viewMode="desktop"
        />
      </div>
    </div>
  );
}

export default PluginSystemExample;
```

---

These advanced examples showcase sophisticated patterns and optimization techniques that can be applied to large-scale, enterprise-level applications using the Component Rendering System. Each example demonstrates specific advanced concepts while maintaining practical applicability. 