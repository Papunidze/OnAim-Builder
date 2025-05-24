export class BuilderService {
  private selected: { desktop: string[]; mobile: string[] } = {
    desktop: [],
    mobile: [],
  };
  private subscribers: (() => void)[] = [];

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.unsubscribe(callback);
    };
  }

  private unsubscribe(callback: () => void): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((sub) => sub());
  }

  addComponent(name: string, viewMode: "desktop" | "mobile"): void {
    this.selected[viewMode].push(name);
    this.notifySubscribers();
  }

  removeComponent(name: string, viewMode: "desktop" | "mobile"): void {
    const viewComponents = this.selected[viewMode];
    const index = viewComponents.indexOf(name);
    if (index > -1) {
      viewComponents.splice(index, 1);
      this.notifySubscribers();
    }
  }

  hasComponent(name: string, viewMode: "desktop" | "mobile"): boolean {
    return this.selected[viewMode].includes(name);
  }

  getComponents(viewMode: "desktop" | "mobile"): string[] {
    return [...this.selected[viewMode]];
  }

  getState(): { desktop: string[]; mobile: string[] } {
    return {
      desktop: [...this.selected.desktop],
      mobile: [...this.selected.mobile],
    };
  }

  clear(): void {
    this.selected = { desktop: [], mobile: [] };
    this.notifySubscribers();
  }
}

export const builderService = new BuilderService();
