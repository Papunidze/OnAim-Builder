import { builderService } from "@app-shared/services/builder";
import type {
  CopyResult,
  CopyServiceEvents,
} from "../types/copy-components.types";
import type { ComponentState } from "@app-shared/services/builder";

type EventCallback<T> = (data: T) => void;

export class CopyService {
  private eventListeners = new Map<
    keyof CopyServiceEvents,
    EventCallback<unknown>[]
  >();
  private isCopying = false;

  constructor() {}

  on<K extends keyof CopyServiceEvents>(
    event: K,
    callback: EventCallback<CopyServiceEvents[K]>
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

  private emit<K extends keyof CopyServiceEvents>(
    event: K,
    data: CopyServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(data));
  }

  async copyBetweenViews(
    fromViewMode: "desktop" | "mobile",
    toViewMode: "desktop" | "mobile"
  ): Promise<CopyResult> {
    if (this.isCopying) {
      throw new Error("Copy operation already in progress");
    }

    if (fromViewMode === toViewMode) {
      throw new Error("Source and target view modes cannot be the same");
    }

    this.isCopying = true;

    this.emit("copyStarted", { from: fromViewMode, to: toViewMode });

    try {
      const sourceComponents = builderService.getLiveComponents(fromViewMode);

      if (sourceComponents.length === 0) {
        const result: CopyResult = {
          success: true,
          copiedCount: 0,
          sourceViewMode: fromViewMode,
          targetViewMode: toViewMode,
          components: [],
        };
        this.emit("componentsCopied", result);
        return result;
      }

      builderService.selectComponent(null);

      const targetComponents = builderService.getLiveComponents(toViewMode);

      if (targetComponents.length > 0) {
        for (const targetComponent of targetComponents) {
          builderService.removeComponent(targetComponent.id);
        }
        
        await new Promise((resolve) => setTimeout(resolve, 100));

        const remainingComponents = builderService.getLiveComponents(toViewMode);
        if (remainingComponents.length > 0) {
          for (const remaining of remainingComponents) {
            builderService.removeComponent(remaining.id);
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      const addedComponents: ComponentState[] = [];

      for (const component of sourceComponents) {
        try {
          const preservedState = {
            props: component.props ? { ...component.props } : {},
            styles: component.styles ? { ...component.styles } : {},
            position: component.position
              ? { ...component.position }
              : undefined,
            size: component.size ? { ...component.size } : undefined,
          };

          const added = await builderService.addComponent(
            component.name,
            toViewMode,
            preservedState
          );

          if (added) {
            await new Promise((resolve) => setTimeout(resolve, 50));

            const forceUpdate: Partial<ComponentState> = {};
            let needsUpdate = false;

            const currentProps = JSON.stringify(added.props || {});
            const expectedProps = JSON.stringify(preservedState.props);
            if (currentProps !== expectedProps) {
              forceUpdate.props = preservedState.props;
              needsUpdate = true;
            }

            const currentStyles = JSON.stringify(added.styles || {});
            const expectedStyles = JSON.stringify(preservedState.styles);
            if (currentStyles !== expectedStyles) {
              forceUpdate.styles = preservedState.styles;
              needsUpdate = true;
            }

            if (needsUpdate) {
              builderService.updateComponent(added.id, forceUpdate);
            }

            addedComponents.push(added);
          }
        } catch (error) {
          console.error(`Error processing component ${component.name}:`, error);
        }
      }

      const finalTargetCount = builderService.getLiveComponents(toViewMode).length;

      if (finalTargetCount !== sourceComponents.length) {
        console.warn(
          `Expected ${sourceComponents.length} components in ${toViewMode}, but found ${finalTargetCount}`
        );
      }

      const result: CopyResult = {
        success: true,
        copiedCount: addedComponents.length,
        sourceViewMode: fromViewMode,
        targetViewMode: toViewMode,
        components: addedComponents,
      };

      this.emit("componentsCopied", result);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.emit("copyFailed", { error: errorMessage });

      const result: CopyResult = {
        success: false,
        copiedCount: 0,
        sourceViewMode: fromViewMode,
        targetViewMode: toViewMode,
        components: [],
      };

      return result;
    } finally {
      this.isCopying = false;
    }
  }

  async copyToDesktop(): Promise<CopyResult> {
    return this.copyBetweenViews("mobile", "desktop");
  }

  async copyToMobile(): Promise<CopyResult> {
    return this.copyBetweenViews("desktop", "mobile");
  }

  isOperationInProgress(): boolean {
    return this.isCopying;
  }
}

export const copyService = new CopyService();
