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
  /**
   * Gets the mobile default values (not current mobile values, but the original mobile defaults)
   */
  static getMobileDefaults(settingsObject: SettingsObject): MobileDesktopResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      // Get desktop defaults first
      const desktopDefaults = typeof settingsObject.getValues === "function" 
        ? settingsObject.getValues() 
        : {};

      // Create a fresh settings object to get original mobile values
      // This ensures we get the defined mobile defaults, not current values
      const mobileDefaults: Record<string, unknown> = {};
      
      // We need to extract mobile defaults by comparing with desktop defaults
      // The idea is to reset the settings and then get mobile values
      const resetDefault = (settingsObject as unknown as Record<string, unknown>).resetDefault;
      if (typeof resetDefault === "function") {
        // Save current state
        const currentJson = typeof settingsObject.getJson === "function" 
          ? settingsObject.getJson() 
          : null;

        // Reset to defaults
        resetDefault.call(settingsObject);

        // Get the mobile values (which should now be the original mobile defaults)
        const originalMobileValues = typeof settingsObject.getMobileValues === "function"
          ? settingsObject.getMobileValues()
          : {};

        // Filter to only include properties that differ from desktop defaults
        for (const [topKey, topValue] of Object.entries(originalMobileValues)) {
          if (typeof topValue === 'object' && topValue !== null && !Array.isArray(topValue)) {
            const desktopGroup = desktopDefaults[topKey];
            if (typeof desktopGroup === 'object' && desktopGroup !== null) {
              const mobileGroup: Record<string, unknown> = {};
              
              for (const [key, mobileValue] of Object.entries(topValue)) {
                const desktopValue = (desktopGroup as Record<string, unknown>)[key];
                
                // Only include if mobile value differs from desktop default
                if (desktopValue !== mobileValue) {
                  mobileGroup[key] = mobileValue;
                }
              }
              
              if (Object.keys(mobileGroup).length > 0) {
                mobileDefaults[topKey] = mobileGroup;
              }
            }
          } else {
            // For non-object values, compare directly
            if (desktopDefaults[topKey] !== topValue) {
              mobileDefaults[topKey] = topValue;
            }
          }
        }

        // Restore previous state if it existed
        const setJson = (settingsObject as unknown as Record<string, unknown>).setJson;
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
        error: error instanceof Error ? error.message : "Failed to get mobile defaults",
      };
    }
  }

  /**
   * Resets only mobile properties to their default mobile values
   * Preserves desktop values for properties without mobile variants
   */
  static resetMobileToDefaults(settingsObject: SettingsObject): ResetMobileResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      // Get the original mobile defaults
      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);
      
      if (!mobileDefaultsResult.success || !mobileDefaultsResult.data) {
        return {
          success: false,
          error: mobileDefaultsResult.error || "Failed to get mobile defaults",
        };
      }

      // Set only the mobile defaults, preserving other values
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
        error: error instanceof Error ? error.message : "Failed to reset mobile values",
      };
    }
  }

  /**
   * Switches to mobile mode and applies mobile defaults while preserving desktop customizations
   */
  static switchToMobile(settingsObject: SettingsObject): MobileDesktopResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      // Get current values to preserve desktop customizations
      const currentValues = typeof settingsObject.getValues === "function"
        ? settingsObject.getValues()
        : {};

      // Get mobile defaults
      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);
      
      if (!mobileDefaultsResult.success) {
        return mobileDefaultsResult;
      }

      // Merge current values with mobile defaults
      // Mobile defaults should override only properties that have mobile variants
      const mergedValues = this.deepMerge(currentValues, mobileDefaultsResult.data || {});

      // Apply the merged values
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
        error: error instanceof Error ? error.message : "Failed to switch to mobile",
      };
    }
  }

  /**
   * Switches to desktop mode by removing mobile overrides
   */
  static switchToDesktop(settingsObject: SettingsObject): MobileDesktopResult {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is required",
      };
    }

    try {
      // Get current values
      const currentValues = typeof settingsObject.getValues === "function"
        ? settingsObject.getValues()
        : {};

      // Get mobile defaults to know what to remove
      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);
      
      if (mobileDefaultsResult.success && mobileDefaultsResult.data) {
        // Clear mobile values by setting them to empty
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
        error: error instanceof Error ? error.message : "Failed to switch to desktop",
      };
    }
  }

  /**
   * Gets properties that have mobile variants defined
   */
  static getMobileCapableProperties(settingsObject: SettingsObject): string[] {
    try {
      const mobileDefaultsResult = this.getMobileDefaults(settingsObject);
      
      if (!mobileDefaultsResult.success || !mobileDefaultsResult.data) {
        return [];
      }

      const properties: string[] = [];
      
      for (const [topKey, topValue] of Object.entries(mobileDefaultsResult.data)) {
        if (typeof topValue === 'object' && topValue !== null) {
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

  /**
   * Deep merge utility for nested objects
   */
  private static deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(
          target[key] as Record<string, unknown> || {}, 
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