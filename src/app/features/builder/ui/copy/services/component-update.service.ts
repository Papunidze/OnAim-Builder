import type { ComponentState } from "@app-shared/services/builder";

export interface SafeUpdateOptions {
  preserveStyles?: boolean;
  preserveProps?: boolean;
  mergeProps?: boolean;
  mergeStyles?: boolean;
}

export class ComponentUpdateService {
  static safeUpdate(
    existingComponent: ComponentState,
    updates: Partial<ComponentState>,
    options: SafeUpdateOptions = {}
  ): ComponentState {
    const {
      preserveStyles = true,
      preserveProps = true,
      mergeProps = true,
      mergeStyles = true,
    } = options;

    const updatedComponent: ComponentState = {
      ...existingComponent,
      ...updates,
      id: existingComponent.id,
    };

    if (updates.props && preserveProps) {
      if (mergeProps) {
        updatedComponent.props = {
          ...existingComponent.props,
          ...updates.props,
        };
      } else {
        updatedComponent.props = updates.props;
      }
    } else if (!updates.props) {
      updatedComponent.props = existingComponent.props;
    }

    if (updates.styles && preserveStyles) {
      if (mergeStyles) {
        updatedComponent.styles = {
          ...existingComponent.styles,
          ...updates.styles,
        };
      } else {
        updatedComponent.styles = updates.styles;
      }
    } else if (!updates.styles) {
      updatedComponent.styles = existingComponent.styles;
    }

    updatedComponent.timestamp = updates.timestamp || Date.now();
    updatedComponent.status = updates.status || existingComponent.status;

    return updatedComponent;
  }

  static wouldLoseStyles(
    existingComponent: ComponentState,
    updates: Partial<ComponentState>
  ): boolean {
    if (
      !existingComponent.styles ||
      Object.keys(existingComponent.styles).length === 0
    ) {
      return false;
    }

    if (!updates.props && !updates.styles) {
      return false;
    }

    if (updates.styles && Object.keys(updates.styles).length === 0) {
      return true;
    }

    if (updates.props) {
      const styleProps = [
        "background",
        "backgroundColor",
        "color",
        "border",
        "borderColor",
      ];
      const hasStyleProps = styleProps.some(
        (prop) => existingComponent.props?.[prop] !== undefined
      );

      if (hasStyleProps) {
        const wouldOverrideStyles = styleProps.some(
          (prop) =>
            updates.props?.[prop] !== undefined &&
            updates.props[prop] !== existingComponent.props?.[prop]
        );
        return wouldOverrideStyles;
      }
    }

    return false;
  }

  static backupStyling(component: ComponentState): {
    props: Record<string, unknown>;
    styles: Record<string, string>;
  } {
    return {
      props: component.props ? JSON.parse(JSON.stringify(component.props)) : {},
      styles: component.styles
        ? JSON.parse(JSON.stringify(component.styles))
        : {},
    };
  }

  static restoreStyling(
    component: ComponentState,
    backup: {
      props: Record<string, unknown>;
      styles: Record<string, string>;
    }
  ): ComponentState {
    return {
      ...component,
      props: { ...component.props, ...backup.props },
      styles: { ...component.styles, ...backup.styles },
    };
  }
}

export const componentUpdateService = ComponentUpdateService;
