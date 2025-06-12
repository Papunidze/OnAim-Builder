import React, { useState } from 'react';
import type { JSX } from 'react';
import { EnhancedContentRenderer } from '../components/enhanced-content-renderer';
import type { ComponentState } from '@app-shared/services/builder';

// Test components with the leaderboard styles
const createStyleTestComponents = (): ComponentState[] => [
  {
    id: 'leaderboard-test',
    name: 'Leaderboard Component',
    viewMode: 'desktop',
    props: {
      rankings: [
        { rank: 1, name: 'Giga', score: 1200 },
        { rank: 2, name: 'Gela', score: 950 },
        { rank: 3, name: 'Eve', score: 780 },
        { rank: 4, name: 'Mallory', score: 630 }
      ]
    },
    styles: {},
    compiledData: {
      files: [
        {
          file: 'leaderboard.css',
          type: 'style',
          content: `.leaderboard {
        max-width: 360px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        font-family: sans-serif;
        overflow: hidden;
        width: 100%;
        height: fit-content;
      }

      .leaderboard-title {
        margin: 0;
        padding: 16px;
        background: linear-gradient(90deg, #007bff, #0056b3);
        color: #fff;
        font-size: 1.4rem;
        text-align: center;
      }

      .leaderboard-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .leaderboard-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.2s;
      }

      .leaderboard-item:hover {
        background: #f9f9f9;
      }

      .leaderboard-rank {
        flex: 0 0 32px;
        font-weight: bold;
        color: #555;
      }

      .leaderboard-name {
        flex: 1;
        color: #333;
        padding: 0 8px;
      }

      .leaderboard-score {
        flex: 0 0 48px;
        text-align: right;
        font-weight: bold;
        color: #007bff;
      }

      .leaderboard-item:last-child {
        border-bottom: none;
      }`,
          prefix: 'lb-test'
        }
      ]
    },
    timestamp: Date.now(),
  },
  {
    id: 'chart-test',
    name: 'Chart Component',
    viewMode: 'desktop',
    props: {
      type: 'bar',
      data: [
        { name: 'Item 1', value: 30 },
        { name: 'Item 2', value: 70 },
        { name: 'Item 3', value: 45 }
      ]
    },
         styles: {},
     compiledData: {
       files: [
         {
           file: 'chart.css',
           type: 'style',
           content: `.chart-container {
         background: white;
         padding: 20px;
         border-radius: 8px;
         box-shadow: 0 2px 8px rgba(0,0,0,0.1);
         font-family: Arial, sans-serif;
       }
       
       .chart-title {
         font-size: 18px;
         font-weight: 600;
         margin-bottom: 15px;
         color: #333;
       }
       
       .chart-bar {
         display: flex;
         align-items: center;
         margin-bottom: 10px;
       }
       
       .bar-label {
         width: 80px;
         font-size: 14px;
         color: #666;
       }
       
       .bar-fill {
         height: 20px;
         background: linear-gradient(90deg, #4caf50, #2e7d32);
         border-radius: 4px;
         margin-right: 10px;
       }
       
       .bar-value {
         font-weight: 600;
         color: #333;
       }`,
           prefix: 'chart-test'
         }
       ]
     },
    timestamp: Date.now(),
  }
];

const StyleTestDemo: React.FC = (): JSX.Element => {
  const [components] = useState<ComponentState[]>(createStyleTestComponents());

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      background: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
          🎨 Style Test Demo
        </h1>
        <p style={{ margin: 0, color: '#666' }}>
          Testing component styles in drag & drop grid layout. 
          The leaderboard and chart should have proper styling applied.
        </p>
      </div>

      <div style={{ 
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <EnhancedContentRenderer
          components={components}
          viewMode="desktop"
          projectId="style-test"
          showDragDropControls={false}
          enableDragDropByDefault
          autoSaveLayouts={false}
        />
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#e8f5e8', 
        border: '1px solid #c3e6c3',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        <strong>✅ Expected Results:</strong>
        <ul style={{ margin: '8px 0 0 20px' }}>
          <li>Leaderboard should have blue gradient header</li>
          <li>Items should have hover effects</li>
          <li>Chart should have styled bars</li>
          <li>Components should be draggable and resizable</li>
        </ul>
      </div>
    </div>
  );
};

export default StyleTestDemo; 