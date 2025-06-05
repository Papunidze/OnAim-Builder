import type { ComponentState } from "@app-shared/services/builder/buiilder.interfaces";

export interface CopyOptions {
  preserveSelection?: boolean;
  clearTarget?: boolean;
  validateSource?: boolean;
}

export class CopyService {
  private deepCloneComponent(
    component: ComponentState,
    newId: string,
    targetViewMode: "desktop" | "mobile"
  ): ComponentState {
    const cloned = JSON.parse(JSON.stringify(component)) as ComponentState;

    cloned.id = newId;
    cloned.viewMode = targetViewMode;
    cloned.timestamp = Date.now();

    cloned.status = "loaded";

    if (component.props) {
      cloned.props = JSON.parse(JSON.stringify(component.props));
    }

    if (component.styles) {
      cloned.styles = JSON.parse(JSON.stringify(component.styles));
    }

    if (component.position) {
      cloned.position = { ...component.position };
    }

    if (component.size) {
      cloned.size = { ...component.size };
    }

    if (component.compiledData) {
      cloned.compiledData = JSON.parse(JSON.stringify(component.compiledData));
    }

    if (component.settings) {
      cloned.settings = JSON.parse(JSON.stringify(component.settings));
    }

    return cloned;
  }

  private generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateCopyOperation(
    sourceComponents: ComponentState[],
    fromMode: "desktop" | "mobile",
    toMode: "desktop" | "mobile"
  ): { isValid: boolean; reason?: string } {
    if (fromMode === toMode) {
      return { isValid: false, reason: "Cannot copy to the same view mode" };
    }

    if (sourceComponents.length === 0) {
      return { isValid: false, reason: "No components to copy" };
    }

    return { isValid: true };
  }

  copyComponents(
    sourceComponents: ComponentState[],
    fromMode: "desktop" | "mobile",
    toMode: "desktop" | "mobile",
    options: CopyOptions = {}
  ): {
    success: boolean;
    copiedComponents: ComponentState[];
    error?: string;
  } {
    const { validateSource = true } = options;

    if (validateSource) {
      const validation = this.validateCopyOperation(
        sourceComponents,
        fromMode,
        toMode
      );
      if (!validation.isValid) {
        return {
          success: false,
          copiedComponents: [],
          error: validation.reason,
        };
      }
    }

    try {
      const copiedComponents: ComponentState[] = [];

      for (const sourceComponent of sourceComponents) {
        const newId = this.generateId();
        const copiedComponent = this.deepCloneComponent(
          sourceComponent,
          newId,
          toMode
        );
        copiedComponents.push(copiedComponent);
      }

      return {
        success: true,
        copiedComponents,
      };
    } catch (error) {
      return {
        success: false,
        copiedComponents: [],
        error: `Copy operation failed: ${(error as Error).message}`,
      };
    }
  }

  copyComponent(
    sourceComponent: ComponentState,
    toMode: "desktop" | "mobile"
  ): ComponentState {
    const newId = this.generateId();
    return this.deepCloneComponent(sourceComponent, newId, toMode);
  }

  getCopyPreview(
    sourceComponents: ComponentState[],
    fromMode: "desktop" | "mobile",
    toMode: "desktop" | "mobile"
  ): {
    canCopy: boolean;
    componentCount: number;
    uniqueComponentTypes: string[];
    hasCustomStyles: boolean;
    hasCustomProps: boolean;
    reason?: string;
  } {
    const validation = this.validateCopyOperation(
      sourceComponents,
      fromMode,
      toMode
    );

    if (!validation.isValid) {
      return {
        canCopy: false,
        componentCount: 0,
        uniqueComponentTypes: [],
        hasCustomStyles: false,
        hasCustomProps: false,
        reason: validation.reason,
      };
    }

    const uniqueTypes = [...new Set(sourceComponents.map((c) => c.name))];
    const hasCustomStyles = sourceComponents.some(
      (c) => c.styles && Object.keys(c.styles).length > 0
    );
    const hasCustomProps = sourceComponents.some(
      (c) => c.props && Object.keys(c.props).length > 0
    );

    return {
      canCopy: true,
      componentCount: sourceComponents.length,
      uniqueComponentTypes: uniqueTypes,
      hasCustomStyles,
      hasCustomProps,
    };
  }
}

export const copyService = new CopyService();
