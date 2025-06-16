import type { Layouts } from "react-grid-layout";

class LayoutService {
  private layouts: Layouts = {};
  private subscribers: ((layouts: Layouts) => void)[] = [];

  getLayouts(): Layouts {
    return { ...this.layouts };
  }

  updateLayouts(layouts: Layouts): void {
    this.layouts = { ...layouts };
    this.notifySubscribers();
  }

  clearLayouts(): void {
    this.layouts = {};
    this.notifySubscribers();
  }

  subscribe(callback: (layouts: Layouts) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.layouts));
  }

  // Helper method to get layouts for a specific view mode
  getLayoutsForViewMode(_viewMode: "desktop" | "mobile"): Layouts {
    return this.getLayouts();
  }

  // Helper method to ensure all instances have layout entries
  ensureInstancesInLayouts(
    instanceIds: string[],
    viewMode: "desktop" | "mobile"
  ): void {
    const layouts = this.getLayouts();
    let updated = false;

    // Define breakpoints based on view mode
    const breakpoints =
      viewMode === "mobile"
        ? ["lg", "md", "sm", "xs", "xxs"]
        : ["lg", "md", "sm", "xs", "xxs"];

    for (const breakpoint of breakpoints) {
      if (!layouts[breakpoint]) {
        layouts[breakpoint] = [];
        updated = true;
      }

      const existingIds = new Set(layouts[breakpoint].map((item) => item.i));

      instanceIds.forEach((id, index) => {
        if (!existingIds.has(id)) {
          const defaultLayout = {
            i: id,
            x: viewMode === "mobile" ? 0 : (index % 2) * 6,
            y: viewMode === "mobile" ? index * 4 : Math.floor(index / 2) * 5,
            w: viewMode === "mobile" ? 2 : 6,
            h: viewMode === "mobile" ? 4 : 5,
            minW: viewMode === "mobile" ? 2 : 4,
            minH: 3,
          };
          layouts[breakpoint].push(defaultLayout);
          updated = true;
        }
      });
    }

    if (updated) {
      this.updateLayouts(layouts);
    }
  }
}

export const layoutService = new LayoutService();
