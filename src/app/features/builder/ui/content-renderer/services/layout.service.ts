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
        x: col * 6, // 0 or 6 (for 2 columns)
        y: row * 5, // Stacked rows
        w: 6, // Half width for 2x2 grid
        h: 5, // Consistent height
        minW: 4,
        minH: 3,
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
          x: col * 6,
          y: row * 5,
          w: 6, 
          h: 5, 
          minW: 4,
          minH: 3,
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
