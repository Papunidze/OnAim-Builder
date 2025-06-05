import type { SettingsObject } from "./settings-compiler";

export interface MobileDesktopResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ResetMobileResult {
  success: boolean;
  resetValues?: Record<string, unknown>;
  error?: string;
}

export class MobileDesktopManager {
  static getMobileDefaults(
    settingsObject: SettingsObject
  ): MobileDesktopResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      const desktopDefaults =
        typeof settingsObject.getValues === "function"
          ? settingsObject.getValues()
          : {};

      const mobileDefaults: Record<string, unknown> = {};

      const resetDefault = (
        settingsObject as unknown as Record<string, unknown>
      ).resetDefault;
      if (typeof resetDefault === "function") {
        const currentJson =
          typeof settingsObject.getJson === "function"
            ? settingsObject.getJson()
            : null;

        resetDefault.call(settingsObject);

        const originalMobileValues =
          typeof settingsObject.getMobileValues === "function"
            ? settingsObject.getMobileValues()
            : {};

        for (const [topKey, topValue] of Object.entries(originalMobileValues)) {
          if (
            typeof topValue === "object" &&
            topValue !== null &&
            !Array.isArray(topValue)
          ) {
            const desktopGroup = desktopDefaults[topKey];
            if (typeof desktopGroup === "object" && desktopGroup !== null) {
              const mobileGroup: Record<string, unknown> = {};

              for (const [key, mobileValue] of Object.entries(topValue)) {
                const desktopValue = (desktopGroup as Record<string, unknown>)[
                  key
                ];

                if (desktopValue !== mobileValue) {
                  mobileGroup[key] = mobileValue;
                }
              }

              if (Object.keys(mobileGroup).length > 0) {
                mobileDefaults[topKey] = mobileGroup;
              }
            }
          } else {
            if (desktopDefaults[topKey] !== topValue) {
              mobileDefaults[topKey] = topValue;
            }
          }
        }

        const setJson = (settingsObject as unknown as Record<string, unknown>)
          .setJson;
        if (currentJson && typeof setJson === "function") {
          try {
            setJson.call(settingsObject, currentJson);
          } catch (error) {
            console.warn("Failed to restore previous state:", error);
          }
        }
      }

      return {
        success: true,
        data: mobileDefaults,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get mobile defaults",
      };
    }
  }

  static resetMobileToDefaults(
    settingsObject: SettingsObject
  ): ResetMobileResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);

      if (!mobileDefaultsResult.success || !mobileDefaultsResult.data) {
        return {
          success: false,
          error: mobileDefaultsResult.error || "Failed to get mobile defaults",
        };
      }

      if (typeof settingsObject.setMobileValues === "function") {
        settingsObject.setMobileValues(mobileDefaultsResult.data);

        return {
          success: true,
          resetValues: mobileDefaultsResult.data,
        };
      } else {
        return {
          success: false,
          error: "Settings object does not support setting mobile values",
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reset mobile values",
      };
    }
  }

  static switchToMobile(settingsObject: SettingsObject): MobileDesktopResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      const currentValues =
        typeof settingsObject.getValues === "function"
          ? settingsObject.getValues()
          : {};

      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);

      if (!mobileDefaultsResult.success) {
        return mobileDefaultsResult;
      }

      const mergedValues = this.deepMerge(
        currentValues,
        mobileDefaultsResult.data || {}
      );

      if (typeof settingsObject.setValue === "function") {
        settingsObject.setValue(mergedValues);
      }

      return {
        success: true,
        data: mergedValues,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to switch to mobile",
      };
    }
  }

  static switchToDesktop(settingsObject: SettingsObject): MobileDesktopResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      const currentValues =
        typeof settingsObject.getValues === "function"
          ? settingsObject.getValues()
          : {};

      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);

      if (mobileDefaultsResult.success && mobileDefaultsResult.data) {
        if (typeof settingsObject.setMobileValues === "function") {
          settingsObject.setMobileValues({});
        }
      }

      return {
        success: true,
        data: currentValues,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to switch to desktop",
      };
    }
  }

  static getMobileCapableProperties(settingsObject: SettingsObject): string[] {
    try {
      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);

      if (!mobileDefaultsResult.success || !mobileDefaultsResult.data) {
        return [];
      }

      const properties: string[] = [];

      for (const [topKey, topValue] of Object.entries(
        mobileDefaultsResult.data
      )) {
        if (typeof topValue === "object" && topValue !== null) {
          for (const key of Object.keys(topValue)) {
            properties.push(`${topKey}.${key}`);
          }
        } else {
          properties.push(topKey);
        }
      }

      return properties;
    } catch (error) {
      console.warn("Failed to get mobile capable properties:", error);
      return [];
    }
  }

  private static deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(
          (target[key] as Record<string, unknown>) || {},
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

export default MobileDesktopManager;
