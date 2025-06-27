import type { Layout } from "react-grid-layout";
import type { ComponentInstanceState } from "../../../types";

export interface GridConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  componentsPerRow: number;
  componentWidth: number;
  defaultHeight: number;
}

export interface ViewModeConfig {
  desktop: GridConfig;
  mobile: GridConfig;
}

export class GridService {
  private static instance: GridService;
  private readonly configs: ViewModeConfig;
  private layouts: Map<string, Layout[]> = new Map();

  private constructor() {
    this.configs = {
      desktop: {
        cols: 12,
        rowHeight: 120,
        margin: [16, 16],
        containerPadding: [20, 20],
        componentsPerRow: 2,
        componentWidth: 4,
        defaultHeight: 3,
      },
      mobile: {
        cols: 6,
        rowHeight: 100,
        margin: [12, 12],
        containerPadding: [16, 16],
        componentsPerRow: 1,
        componentWidth: 4,
        defaultHeight: 2,
      },
    };
  }

  static getInstance(): GridService {
    if (!GridService.instance) {
      GridService.instance = new GridService();
    }
    return GridService.instance;
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
        minW: 2,
        minH: 2,
      };
    });
  }

  generateLayoutForNewInstances(
    instances: ComponentInstanceState[], 
    existingLayout: Layout[], 
    viewMode: 'desktop' | 'mobile' = 'desktop'
  ): Layout[] {
    const config = this.configs[viewMode];
    
    const occupiedPositions = new Set<string>();
    
    existingLayout.forEach(item => {
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          occupiedPositions.add(`${x},${y}`);
        }
      }
    });
    
    const maxY = existingLayout.length > 0 
      ? Math.max(...existingLayout.map(item => item.y + item.h))
      : 0;
    
    return instances.map((instance, index) => {
      const col = index % config.componentsPerRow;
      const row = Math.floor(index / config.componentsPerRow);
      
      const xPosition = col * config.componentWidth;
      const safeX = Math.min(xPosition, config.cols - config.componentWidth);
      const yPosition = maxY + (row * config.defaultHeight);

      return {
        i: instance.id,
        x: safeX,
        y: yPosition,
        w: config.componentWidth,
        h: config.defaultHeight,
        minW: 2,
        minH: 2,
      };
    });
  }

  saveLayout(viewMode: string, layout: Layout[]): void {
    const key = `layout_${viewMode}`;
    this.layouts.set(key, [...layout]);
    
    try {
      localStorage.setItem(key, JSON.stringify(layout));
    } catch (error) {
      console.warn('Failed to save layout to localStorage:', error);
    }
  }

  loadLayout(viewMode: string): Layout[] | null {
    const key = `layout_${viewMode}`;
    
    if (this.layouts.has(key)) {
      return [...this.layouts.get(key)!];
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const layout = JSON.parse(stored) as Layout[];
        this.layouts.set(key, layout);
        return [...layout];
      }
    } catch (error) {
      console.warn('Failed to load layout from localStorage:', error);
    }

    return null;
  }

  clearLayout(viewMode: string): void {
    const key = `layout_${viewMode}`;
    this.layouts.delete(key);
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear layout from localStorage:', error);
    }
  }

  hasLayoutChanged(
    currentLayout: Layout[],
    instances: ComponentInstanceState[]
  ): boolean {
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

  optimizeLayout(layout: Layout[]): Layout[] {
    const optimized: Layout[] = [];
    const occupied = new Set<string>();

    layout.forEach(item => {
      let conflicts = false;
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          const key = `${x},${y}`;
          if (occupied.has(key)) {
            conflicts = true;
            break;
          }
        }
        if (conflicts) break;
      }

      if (!conflicts) {
        for (let x = item.x; x < item.x + item.w; x++) {
          for (let y = item.y; y < item.y + item.h; y++) {
            occupied.add(`${x},${y}`);
          }
        }
        optimized.push(item);
      }
    });

    return optimized;
  }

  exportLayout(viewMode: string): string | null {
    const layout = this.loadLayout(viewMode);
    if (!layout) return null;

    return JSON.stringify({
      viewMode,
      timestamp: Date.now(),
      layout,
      config: this.configs,
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
}

export const gridService = GridService.getInstance(); 