import React, { useState } from 'react';
import type { JSX } from 'react';
import { EnhancedContentRenderer } from '../components/enhanced-content-renderer';
import type { ComponentState } from '@app-shared/services/builder';
import type { ViewMode } from '../types';

// Mock component data for demonstration
const mockComponents: ComponentState[] = [
  {
    id: 'header-1',
    name: 'Header Component',
    viewMode: 'desktop',
    props: {},
    styles: {},
    timestamp: Date.now(),
  },
  {
    id: 'card-1', 
    name: 'Card Component',
    viewMode: 'desktop',
    props: {},
    styles: {},
    timestamp: Date.now(),
  },
  {
    id: 'button-1',
    name: 'Button Component', 
    viewMode: 'desktop',
    props: {},
    styles: {},
    timestamp: Date.now(),
  },
  {
    id: 'text-1',
    name: 'Text Component',
    viewMode: 'desktop',
    props: {},
    styles: {},
    timestamp: Date.now(),
  },
  {
    id: 'image-1',
    name: 'Image Component',
    viewMode: 'desktop',
    props: {},
    styles: {},
    timestamp: Date.now(),
  },
];

const DragDropExample: React.FC = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [components, setComponents] = useState<ComponentState[]>(mockComponents);

  // Example: Add a new component dynamically
  const addRandomComponent = (): void => {
    const componentTypes = ['Card', 'Button', 'Text', 'Image', 'Header'];
    const randomType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
    const newId = `${randomType.toLowerCase()}-${Date.now()}`;
    
    const newComponent: ComponentState = {
      id: newId,
      name: `${randomType} Component`,
      viewMode: 'desktop',
      props: {},
      styles: {},
      timestamp: Date.now(),
    };
    
    setComponents(prev => [...prev, newComponent]);
  };

  // Example: Remove a component
  const removeComponent = (componentId: string): void => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
  };

  return (
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center', 
        flexWrap: 'wrap' 
      }}>
        <h2 style={{ margin: 0, flex: 1 }}>
          🎯 Drag & Drop Builder Demo
        </h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>View Mode:</span>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                border: '1px solid #ccc' 
              }}
            >
              <option value="desktop">🖥️ Desktop</option>
              <option value="mobile">📱 Mobile</option>
            </select>
          </label>

          {/* Add Component Button */}
          <button
            onClick={addRandomComponent}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ➕ Add Component
          </button>

          {/* Component Count */}
          <span style={{ 
            padding: '4px 8px', 
            background: '#f8f9fa', 
            borderRadius: '4px', 
            fontSize: '14px' 
          }}>
            {components.length} components
          </span>
        </div>
      </div>

      {/* Component List */}
      <div style={{ 
        marginBottom: '10px', 
        display: 'flex', 
        gap: '5px', 
        flexWrap: 'wrap' 
      }}>
        {components.map(component => (
          <span
            key={component.id}
            style={{
              padding: '2px 8px',
              background: '#e9ecef',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {component.name}
            <button
              onClick={() => removeComponent(component.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc3545',
                cursor: 'pointer',
                padding: '0',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* Enhanced Content Renderer with Drag & Drop */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <EnhancedContentRenderer
          components={components}
          viewMode={viewMode}
          projectId="demo-project"
          showDragDropControls
          autoSaveLayouts
        />
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#f8f9fa', 
        borderRadius: '6px',
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        <strong>📋 Instructions:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Toggle &quot;Drag &amp; Drop&quot; to enable/disable the grid layout</li>
          <li>In drag mode: drag components by their purple headers</li>
          <li>Resize components using the bottom-right corner handle</li>
          <li>Switch between Desktop and Mobile view modes</li>
          <li>Layouts are automatically saved to localStorage</li>
          <li>Add/remove components to see dynamic layout updates</li>
        </ul>
      </div>
    </div>
  );
};

export default DragDropExample; 