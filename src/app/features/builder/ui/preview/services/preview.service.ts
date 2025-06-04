import type { 
  PreviewServiceEvents, 
  PreviewState, 
  PreviewOptions, 
  PreviewMode
} from "../types/preview.types";

type EventCallback<T> = (data: T) => void;

export class PreviewService {
  private state: PreviewState = {
    isOpen: false,
    mode: "modal",
    options: {
      viewMode: "desktop",
      showGrid: false,
      showLabels: false,
      backgroundColor: "#ffffff",
      scale: 1,
    },
    detachedWindow: null,
  };

  private subscribers: (() => void)[] = [];
  private eventListeners = new Map<
    keyof PreviewServiceEvents,
    EventCallback<unknown>[]
  >();

  constructor() {}

  on<K extends keyof PreviewServiceEvents>(
    event: K,
    callback: EventCallback<PreviewServiceEvents[K]>
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.push(callback as EventCallback<unknown>);

    return () => {
      const index = listeners.indexOf(callback as EventCallback<unknown>);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  private emit<K extends keyof PreviewServiceEvents>(
    event: K,
    data: PreviewServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(data));
  }

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

  openPreview(mode: PreviewMode = "modal", viewMode: "desktop" | "mobile" = "desktop"): void {
    this.state.isOpen = true;
    this.state.mode = mode;
    this.state.options.viewMode = viewMode;

    this.emit("previewOpened", { viewMode });
    this.notifySubscribers();
  }

  closePreview(): void {
    this.state.isOpen = false;
    this.emit("previewClosed", undefined);
    this.notifySubscribers();
  }

  getState(): PreviewState {
    return { ...this.state };
  }

  isOpen(): boolean {
    return this.state.isOpen;
  }

  getOptions(): PreviewOptions {
    return { ...this.state.options };
  }

  getMode(): PreviewMode {
    return this.state.mode;
  }
}

export const previewService = new PreviewService(); 