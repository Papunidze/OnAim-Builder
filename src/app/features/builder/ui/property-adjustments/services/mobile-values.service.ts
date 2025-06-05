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
}

export default MobileValuesService;
