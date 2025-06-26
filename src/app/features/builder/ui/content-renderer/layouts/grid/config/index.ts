import type { GridConfig } from "../services/enhanced-grid.service";

export interface ViewModeConfig {
  desktop: GridConfig;
  mobile: GridConfig;
}

export const GRID_CONFIGS: ViewModeConfig = {
  desktop: {
    cols: 12,
    rowHeight: 150,
    margin: [20, 20],
    containerPadding: [24, 24],
    componentsPerRow: 2,
    componentWidth:5, 
    defaultHeight: 2, 
    minWidth: 3, 
    minHeight: 2, 
    maxWidth: 12,
    maxHeight: 8, 
  },
  mobile: {
    cols: 6,
    rowHeight: 120,
    margin: [16, 16],
    containerPadding: [20, 20],
    componentsPerRow: 1,
    componentWidth: 6, 
    defaultHeight: 2, 
    minWidth: 6, 
    minHeight: 2,
    maxWidth: 6,
    maxHeight: 6,
  },
}; 