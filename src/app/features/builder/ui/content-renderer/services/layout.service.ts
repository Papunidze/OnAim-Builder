import type { Layout } from "react-grid-layout";

class LayoutService {
  private layout: Layout[] = [];
  private subscribers: ((layout: Layout[]) => void)[] = [];

  getLayout(): Layout[] {
    return [...this.layout];
  }

  updateLayout(layout: Layout[]): void {
    this.layout = [...layout];
    this.notifySubscribers();
  }

  clearLayout(): void {
    this.layout = [];
    this.notifySubscribers();
  }

  subscribe(callback: (layout: Layout[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.layout));
  }

  generateConsistentLayout(instanceIds: string[]): void {
    const layout = instanceIds.map((id, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      
      return {
        i: id,
        x: col * 5, // 0 or 5 (4 width + 1 spacing)
        y: row * 4, // Consistent with grid layout spacing
        w: 4, // Match grid layout default width
        h: 3, // Match grid layout default height  
        minW: 3, // Match grid layout minimum width
        minH: 2, // Match grid layout minimum height
      };
    });

    this.updateLayout(layout);
  }

  ensureInstancesInLayout(instanceIds: string[]): void {
    const currentLayout = this.getLayout();
    let updated = false;

    const existingIds = new Set(currentLayout.map((item) => item.i));

    instanceIds.forEach((id, index) => {
      if (!existingIds.has(id)) {
        const col = index % 2;
        const row = Math.floor(index / 2);
        
        const defaultLayout = {
          i: id,
          x: col * 5, // 0 or 5 (4 width + 1 spacing)
          y: row * 4, // Consistent with grid layout spacing
          w: 4, // Match grid layout default width
          h: 3, // Match grid layout default height
          minW: 3, // Match grid layout minimum width  
          minH: 2, // Match grid layout minimum height
        };
        
        currentLayout.push(defaultLayout);
        updated = true;
      }
    });

    if (updated) {
      this.updateLayout(currentLayout);
    }
  }
}

export const layoutService = new LayoutService();
