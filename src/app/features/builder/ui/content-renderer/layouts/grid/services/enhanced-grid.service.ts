import type { Layout } from "react-grid-layout";
import type { ComponentInstanceState } from "../../../types";
import { GRID_CONFIGS, type ViewModeConfig } from "../config";

export interface GridConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  componentsPerRow: number;
  componentWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}


export class EnhancedGridService {
  private static instance: EnhancedGridService;
  private readonly configs: ViewModeConfig;
  private layouts: Map<string, Layout[]> = new Map();
  
  private readonly configVersion = "2.1";

  private constructor() {
    this.configs = GRID_CONFIGS;
  }

  static getInstance(): EnhancedGridService {
    if (!EnhancedGridService.instance) {
      EnhancedGridService.instance = new EnhancedGridService();
    }
    return EnhancedGridService.instance;
  }

  getConfig(viewMode: 'desktop' | 'mobile' = 'desktop'): GridConfig {
    return { ...this.configs[viewMode] };
  }

  generateDefaultLayout(instances: ComponentInstanceState[], viewMode: 'desktop' | 'mobile' = 'desktop'): Layout[] {
    const config = this.configs[viewMode];
    
    return instances.map((instance, index) => {
      const col = index % config.componentsPerRow;
      const row = Math.floor(index / config.componentsPerRow);
      
      const xPosition = col * config.componentWidth;
      const safeX = Math.min(xPosition, config.cols - config.componentWidth);

      return {
        i: instance.id,
        x: safeX,
        y: row * config.defaultHeight,
        w: config.componentWidth,
        h: config.defaultHeight,
        minW: config.minWidth,
        minH: config.minHeight,
        maxW: config.maxWidth,
        maxH: config.maxHeight
      };
    });
  }

  generateOptimizedLayout(instances: ComponentInstanceState[], viewMode: 'desktop' | 'mobile' = 'desktop'): Layout[] {
    const config = this.configs[viewMode];
    const layout: Layout[] = [];
    
    let currentX = 0;
    let currentY = 0;
    let maxHeightInRow = 0;

    instances.forEach((instance) => {
      if (currentX + config.componentWidth > config.cols) {
        currentX = 0;
        currentY += maxHeightInRow;
        maxHeightInRow = 0;
      }

      const layoutItem: Layout = {
        i: instance.id,
        x: currentX,
        y: currentY,
        w: config.componentWidth,
        h: config.defaultHeight,
        minW: config.minWidth,
        minH: config.minHeight,
        maxW: config.maxWidth,
        maxH: config.maxHeight,
      };

      layout.push(layoutItem);
      
      currentX += config.componentWidth;
      maxHeightInRow = Math.max(maxHeightInRow, config.defaultHeight);
    });

    return layout;
  }

  saveLayout(viewMode: string, layout: Layout[]): void {
    const key = `enhanced_layout_${viewMode}_v${this.configVersion}`;
    this.layouts.set(key, [...layout]);
    
    try {
      // Clear old version layouts
      this.clearOldVersionLayouts(viewMode);
      localStorage.setItem(key, JSON.stringify(layout));
    } catch (error) {
      console.warn('Failed to save layout to localStorage:', error);
    }
  }

  loadLayout(viewMode: string): Layout[] | null {
    const key = `enhanced_layout_${viewMode}_v${this.configVersion}`;
    
    // First check memory cache
    if (this.layouts.has(key)) {
      return [...this.layouts.get(key)!];
    }

    // Then check localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const layout = JSON.parse(stored) as Layout[];
        // Validate that layout items have proper dimensions
        const validLayout = this.validateAndEnhanceLayout(layout, viewMode as 'desktop' | 'mobile');
        this.layouts.set(key, validLayout);
        return [...validLayout];
      }
    } catch (error) {
      console.warn('Failed to load layout from localStorage:', error);
    }

    return null;
  }

  clearLayout(viewMode: string): void {
    const key = `enhanced_layout_${viewMode}_v${this.configVersion}`;
    this.layouts.delete(key);
    
    try {
      localStorage.removeItem(key);
      this.clearOldVersionLayouts(viewMode);
    } catch (error) {
      console.warn('Failed to clear layout from localStorage:', error);
    }
  }

  private clearOldVersionLayouts(viewMode: string): void {
    try {
      // Clear old version layouts
      localStorage.removeItem(`layout_${viewMode}`);
      localStorage.removeItem(`enhanced_layout_${viewMode}_v1.0`);
    } catch (error) {
      console.warn('Failed to clear old layouts:', error);
    }
  }

  private validateAndEnhanceLayout(layout: Layout[], viewMode: 'desktop' | 'mobile'): Layout[] {
    const config = this.configs[viewMode];
    
    return layout.map(item => ({
      ...item,
      // Ensure minimum dimensions
      w: Math.max(item.w || config.componentWidth, config.minWidth),
      h: Math.max(item.h || config.defaultHeight, config.minHeight),
      // Add min/max constraints
      minW: config.minWidth,
      minH: config.minHeight,
      maxW: config.maxWidth,
      maxH: config.maxHeight,
    })).filter(item => 
      item.i && 
      typeof item.x === 'number' && 
      typeof item.y === 'number' && 
      typeof item.w === 'number' && 
      typeof item.h === 'number' &&
      item.x >= 0 && 
      item.y >= 0 && 
      item.w > 0 && 
      item.h > 0
    );
  }

  hasLayoutChanged(currentLayout: Layout[], instances: ComponentInstanceState[]): boolean {
    const currentLayoutIds = currentLayout.map((item) => item.i);
    const instanceIds = instances.map((instance) => instance.id);

    const hasNewInstances = instanceIds.some(
      (id) => !currentLayoutIds.includes(id)
    );
    const hasRemovedInstances = currentLayoutIds.some(
      (id) => !instanceIds.includes(id)
    );

    return hasNewInstances || hasRemovedInstances;
  }

  validateLayout(layout: Layout[]): Layout[] {
    return layout.filter(item => 
      item.i && 
      typeof item.x === 'number' && 
      typeof item.y === 'number' && 
      typeof item.w === 'number' && 
      typeof item.h === 'number' &&
      item.x >= 0 && 
      item.y >= 0 && 
      item.w > 0 && 
      item.h > 0
    );
  }

  resetToDefaultLayout(instances: ComponentInstanceState[], viewMode: 'desktop' | 'mobile'): Layout[] {
    this.clearLayout(viewMode);
    return this.generateOptimizedLayout(instances, viewMode);
  }

  exportLayout(viewMode: string): string | null {
    const layout = this.loadLayout(viewMode);
    if (!layout) return null;

    return JSON.stringify({
      viewMode,
      version: this.configVersion,
      timestamp: Date.now(),
      layout,
      config: this.configs[viewMode as 'desktop' | 'mobile'],
    }, null, 2);
  }

  importLayout(data: string): { viewMode: string; layout: Layout[] } | null {
    try {
      const parsed = JSON.parse(data);
      if (parsed.layout && parsed.viewMode) {
        const validatedLayout = this.validateLayout(parsed.layout);
        return {
          viewMode: parsed.viewMode,
          layout: validatedLayout,
        };
      }
    } catch (error) {
      console.error('Failed to import layout:', error);
    }
    return null;
  }

  // Debug helpers
  logLayoutInfo(layout: Layout[], viewMode: 'desktop' | 'mobile'): void {
    const config = this.configs[viewMode];
    console.log(`=== ${viewMode.toUpperCase()} LAYOUT INFO ===`);
    console.log('Config:', config);
    console.log('Layout items:', layout.length);
    layout.forEach((item, index) => {
      const actualWidth = (item.w / config.cols) * 100;
      const actualHeight = item.h * config.rowHeight;
      console.log(`Item ${index + 1}:`, {
        id: item.i,
        gridPosition: `${item.x},${item.y}`,
        gridSize: `${item.w}x${item.h}`,
        actualSize: `${actualWidth.toFixed(1)}% x ${actualHeight}px`
      });
    });
  }
}

export const enhancedGridService = EnhancedGridService.getInstance(); 