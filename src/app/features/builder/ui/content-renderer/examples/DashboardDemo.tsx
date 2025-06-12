import React, { useState } from 'react';
import type { JSX } from 'react';
import { EnhancedContentRenderer } from '../components/enhanced-content-renderer';
import type { ComponentState } from '@app-shared/services/builder';
import type { ViewMode } from '../types';

// Demo dashboard components similar to what the user showed
const createDashboardComponents = (): ComponentState[] => [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    viewMode: 'desktop',
    props: {
      title: 'AI Executive Summary',
      content: 'The OnAim workspace is currently managing several tasks within the "Brazil Issues" list.',
      priority: 'high'
    },
    styles: { 
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    timestamp: Date.now(),
  },
  {
    id: 'task-counters',
    name: 'Task Status Counters',
    viewMode: 'desktop',
    props: {
      unassigned: 0,
      inProgress: 18,
      completed: 11
    },
    styles: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-around'
    },
    timestamp: Date.now(),
  },
  {
    id: 'pie-chart',
    name: 'Total Tasks by Assignee',
    viewMode: 'desktop',
    props: {
      type: 'pie',
      data: [
        { name: 'Giga Papunidze', value: 27.02, color: '#8bc34a' },
        { name: 'nutsa margvelashvili', value: 21.62, color: '#9c27b0' },
        { name: 'Tsotne Darjania', value: 21.62, color: '#607d8b' },
        { name: 'Abo Akhvlediani', value: 5.4, color: '#f44336' },
        { name: 'Others', value: 24.34, color: '#ff9800' }
      ]
    },
    styles: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      minHeight: '300px'
    },
    timestamp: Date.now(),
  },
  {
    id: 'bar-chart',
    name: 'Open Tasks by Assignee',
    viewMode: 'desktop',
    props: {
      type: 'bar',
      data: [
        { name: 'nutsa margvelashvili', tasks: 7, color: '#9c27b0' },
        { name: 'Gvantsa', tasks: 1, color: '#ff9800' },
        { name: 'Sumelji Burduli', tasks: 1, color: '#00bcd4' },
        { name: 'Abo Akhvlediani', tasks: 2, color: '#f44336' },
        { name: 'Giga Papunidze', tasks: 10, color: '#2196f3' },
        { name: 'Lasha Kalandadze', tasks: 2, color: '#424242' }
      ]
    },
    styles: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      minHeight: '250px'
    },
    timestamp: Date.now(),
  },
  {
    id: 'workload-progress',
    name: 'Workload by Status',
    viewMode: 'desktop',
    props: {
      type: 'progress',
      data: {
        unassigned: { count: 0, color: '#9e9e9e' },
        inProgress: { count: 18, color: '#9c27b0' },
        completed: { count: 11, color: '#4caf50' }
      }
    },
    styles: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px'
    },
    timestamp: Date.now(),
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    viewMode: 'desktop',
    props: {
      title: 'Leaderboard',
      rankings: [
        { rank: 1, name: 'Giga', score: 1200, color: '#2196f3' },
        { rank: 2, name: 'Gela', score: 950, color: '#ff9800' },
        { rank: 3, name: 'Eve', score: 780, color: '#9c27b0' },
        { rank: 4, name: 'Mallory', score: 630, color: '#f44336' }
      ]
    },
    styles: {
      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
      padding: '20px',
      borderRadius: '8px',
      color: 'white',
      border: '3px solid #2196f3'
    },
    timestamp: Date.now(),
  },
  {
    id: 'weekly-completion',
    name: 'Tasks Completed This Week',
    viewMode: 'desktop',
    props: {
      type: 'metric',
      value: 'No Results',
      description: 'Weekly completion rate'
    },
    styles: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center'
    },
    timestamp: Date.now(),
  }
];

const DashboardDemo: React.FC = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [components] = useState<ComponentState[]>(createDashboardComponents());

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>
          📊 Dashboard Demo - Drag & Drop Builder
        </h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>View:</span>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="desktop">🖥️ Desktop</option>
              <option value="mobile">📱 Mobile</option>
            </select>
          </label>

          <div style={{ 
            padding: '6px 12px', 
            background: '#e3f2fd', 
            borderRadius: '4px', 
            fontSize: '12px',
            color: '#1976d2',
            fontWeight: '500'
          }}>
            {components.length} Components
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <EnhancedContentRenderer
          components={components}
          viewMode={viewMode}
          projectId="dashboard-demo"
          showDragDropControls
          enableDragDropByDefault
          autoSaveLayouts
        />
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '6px',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        <strong>🎯 Dashboard Features:</strong>
        <ul style={{ margin: '10px 0 0 20px', paddingLeft: '0' }}>
          <li>✅ <strong>Drag & Drop:</strong> Move components by dragging the purple headers</li>
          <li>✅ <strong>Resize:</strong> Use the bottom-right corner handles to resize</li>
          <li>✅ <strong>Auto-Save:</strong> Layouts are automatically saved</li>
          <li>✅ <strong>Responsive:</strong> Different layouts for desktop and mobile</li>
          <li>✅ <strong>Control Panel:</strong> Toggle drag mode, reset layouts, and more</li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardDemo; 