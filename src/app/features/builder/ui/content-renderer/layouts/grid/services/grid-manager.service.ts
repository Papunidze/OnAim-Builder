import type { Layout } from "react-grid-layout";
import type { ComponentInstanceState } from "../../../types";
import { gridService, type GridConfig } from "./grid.service";

export interface GridManagerOptions {
  viewMode: string;
  autoSave?: boolean;
  persistLayout?: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  onError?: (error: Error) => void;
}

export class GridManager {
  private readonly options: Required<GridManagerOptions>;
  private currentLayout: Layout[] = [];
  private instances: ComponentInstanceState[] = [];
  private isInitialized = false;

  constructor(options: GridManagerOptions) {
    this.options = {
      autoSave: true,
      persistLayout: true,
      onLayoutChange: () => {},
      onError: () => {},
      ...options,
    };
  }

  async initialize(instances: ComponentInstanceState[]): Promise<Layout[]> {
    try {
      this.instances = instances;
      
      if (this.options.persistLayout) {
        const savedLayout = gridService.loadLayout(this.options.viewMode);
        if (savedLayout && savedLayout.length > 0) {
          this.currentLayout = gridService.validateLayout(savedLayout);
          this.isInitialized = true;
          return this.currentLayout;
        }
      }

      this.currentLayout = gridService.generateDefaultLayout(instances);
      this.isInitialized = true;
      return this.currentLayout;
    } catch (error) {
      this.options.onError(error as Error);
      this.currentLayout = gridService.generateDefaultLayout(instances);
      this.isInitialized = true;
      return this.currentLayout;
    }
  }

  updateInstances(instances: ComponentInstanceState[]): Layout[] | null {
    if (!this.isInitialized) {
      throw new Error('GridManager not initialized. Call initialize() first.');
    }

    this.instances = instances;

    if (gridService.hasLayoutChanged(this.currentLayout, instances)) {
      this.currentLayout = gridService.generateDefaultLayout(instances);
      this.saveLayout();
      return this.currentLayout;
    }

    return null;
  }

  updateLayout(newLayout: Layout[]): void {
    if (!this.isInitialized) {
      throw new Error('GridManager not initialized. Call initialize() first.');
    }

    const validatedLayout = gridService.validateLayout(newLayout);
    this.currentLayout = validatedLayout;
    this.options.onLayoutChange(validatedLayout);
    
    if (this.options.autoSave && this.options.persistLayout) {
      this.saveLayout();
    }
  }

  saveLayout(): void {
    if (this.options.persistLayout) {
      gridService.saveLayout(this.options.viewMode, this.currentLayout);
    }
  }

  resetLayout(): Layout[] {
    this.currentLayout = gridService.generateDefaultLayout(this.instances);
    
    if (this.options.persistLayout) {
      gridService.clearLayout(this.options.viewMode);
    }
    
    this.options.onLayoutChange(this.currentLayout);
    return this.currentLayout;
  }

  optimizeLayout(): Layout[] {
    this.currentLayout = gridService.optimizeLayout(this.currentLayout);
    this.saveLayout();
    this.options.onLayoutChange(this.currentLayout);
    return this.currentLayout;
  }

  exportLayout(): string | null {
    return gridService.exportLayout(this.options.viewMode);
  }

  importLayout(data: string): boolean {
    try {
      const result = gridService.importLayout(data);
      if (result) {
        this.currentLayout = result.layout;
        this.saveLayout();
        this.options.onLayoutChange(this.currentLayout);
        return true;
      }
      return false;
    } catch (error) {
      this.options.onError(error as Error);
      return false;
    }
  }

  getCurrentLayout(): Layout[] {
    return [...this.currentLayout];
  }

  getConfig(): GridConfig {
    return gridService.getConfig();
  }

  getInstanceById(id: string): ComponentInstanceState | undefined {
    return this.instances.find(instance => instance.id === id);
  }

  getLayoutItemById(id: string): Layout | undefined {
    return this.currentLayout.find(item => item.i === id);
  }

  isValidLayout(layout: Layout[]): boolean {
    return gridService.validateLayout(layout).length === layout.length;
  }

  dispose(): void {
    this.isInitialized = false;
    this.currentLayout = [];
    this.instances = [];
  }

  getLayout(): Layout[] {
    return this.currentLayout;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Factory function for creating grid managers
export function createGridManager(options: GridManagerOptions): GridManager {
  return new GridManager(options);
} 