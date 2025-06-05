import type { SettingsObject } from "./settings-compiler";

export interface MobileValuesResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface SetMobileValuesResult {
  success: boolean;
  error?: string;
}

export interface ComponentWithProps {
  props: Record<string, unknown>;
  viewMode?: "desktop" | "mobile";
  id?: string;
  type?: string;
}

export interface ComponentUpdateResult {
  success: boolean;
  updatedProps?: Record<string, unknown>;
  error?: string;
}

export class MobileValuesService {
  static getMobileValues(settingsObject: SettingsObject): MobileValuesResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    if (typeof settingsObject.getMobileValues !== "function") {
      return {
        success: false,
        error: "Settings object does not support mobile values",
      };
    }

    try {
      const mobileValues = settingsObject.getMobileValues();
      return {
        success: true,
        data: mobileValues || {},
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get mobile values",
      };
    }
  }

  static setMobileValues(
    settingsObject: SettingsObject,
    values: Record<string, unknown>
  ): SetMobileValuesResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    if (typeof settingsObject.setMobileValues !== "function") {
      return {
        success: false,
        error: "Settings object does not support mobile values",
      };
    }

    if (!values || typeof values !== "object") {
      return {
        success: false,
        error: "Values must be a valid object",
      };
    }

    try {
      settingsObject.setMobileValues(values);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to set mobile values",
      };
    }
  }

  static applyMobileValues(
    settingsObject: SettingsObject,
    viewMode: "desktop" | "mobile",
    onUpdate?: (values: Record<string, unknown>) => void
  ): MobileValuesResult {
    if (viewMode === "mobile") {
      const result = this.getMobileValues(settingsObject);
      if (result.success && result.data && onUpdate) {
        onUpdate(result.data);
      }
      return result;
    }

    if (typeof settingsObject.getValues === "function") {
      try {
        const desktopValues = settingsObject.getValues();
        if (onUpdate) {
          onUpdate(desktopValues || {});
        }
        return {
          success: true,
          data: desktopValues || {},
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get desktop values",
        };
      }
    }

    return {
      success: false,
      error: "Settings object does not support getting values",
    };
  }

  static supportsMobileValues(settingsObject: SettingsObject): boolean {
    return (
      settingsObject &&
      typeof settingsObject.getMobileValues === "function" &&
      typeof settingsObject.setMobileValues === "function"
    );
  }

  static updateComponentPropsForViewMode(
    component: ComponentWithProps,
    viewMode: "desktop" | "mobile",
    settingsObject: SettingsObject
  ): Record<string, unknown> | null {
    if (viewMode === "mobile" && this.supportsMobileValues(settingsObject)) {
      const result = this.getMobileValues(settingsObject);
      if (result.success && result.data) {
        return { ...component.props, ...result.data };
      }
    }

    if (typeof settingsObject.getValues === "function") {
      try {
        const regularValues = settingsObject.getValues();
        return { ...component.props, ...regularValues };
      } catch (error) {
        console.warn("Failed to get regular values:", error);
      }
    }

    return null;
  }

  static refreshComponentMobileValues(
    component: ComponentWithProps,
    settingsObject: SettingsObject
  ): ComponentUpdateResult {
    if (!component || !settingsObject) {
      return {
        success: false,
        error: "Component and settings object are required",
      };
    }

    if (component.viewMode !== "mobile") {
      return {
        success: false,
        error: "Component is not in mobile view mode",
      };
    }

    const updatedProps = this.updateComponentPropsForViewMode(
      component,
      "mobile",
      settingsObject
    );
    if (updatedProps) {
      return {
        success: true,
        updatedProps,
      };
    }

    return {
      success: false,
      error: "Failed to refresh mobile values",
    };
  }

  static getFilteredMobileValues(
    settingsObject: SettingsObject
  ): MobileValuesResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    if (typeof settingsObject.getMobileValues !== "function") {
      return {
        success: false,
        error: "Settings object does not support mobile values",
      };
    }

    try {
      const mobileValues = settingsObject.getMobileValues();
      if (!mobileValues || Object.keys(mobileValues).length === 0) {
        return {
          success: true,
          data: {},
        };
      }

      const desktopDefaults =
        typeof settingsObject.getValues === "function"
          ? settingsObject.getValues()
          : {};

      const filteredMobileValues: Record<string, unknown> = {};

      for (const [topKey, topValue] of Object.entries(mobileValues)) {
        if (
          typeof topValue === "object" &&
          topValue !== null &&
          !Array.isArray(topValue)
        ) {
          const desktopGroup = desktopDefaults[topKey];
          if (typeof desktopGroup === "object" && desktopGroup !== null) {
            const filteredGroup: Record<string, unknown> = {};

            for (const [key, mobileValue] of Object.entries(topValue)) {
              const desktopValue = (desktopGroup as Record<string, unknown>)[
                key
              ];

              if (desktopValue !== mobileValue) {
                filteredGroup[key] = mobileValue;
              }
            }

            if (Object.keys(filteredGroup).length > 0) {
              filteredMobileValues[topKey] = filteredGroup;
            }
          } else {
            filteredMobileValues[topKey] = topValue;
          }
        } else {
          if (desktopDefaults[topKey] !== topValue) {
            filteredMobileValues[topKey] = topValue;
          }
        }
      }

      return {
        success: true,
        data: filteredMobileValues,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get mobile values",
      };
    }
  }
}

export default MobileValuesService;
