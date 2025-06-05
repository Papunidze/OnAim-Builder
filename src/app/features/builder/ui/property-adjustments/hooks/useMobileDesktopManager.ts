import { useCallback } from "react";
import type { SettingsObject } from "../services/settings-compiler";
import { MobileDesktopManager, type MobileDesktopResult, type ResetMobileResult } from "../services/mobile-desktop-manager.service";

export interface UseMobileDesktopManagerResult {
  getMobileDefaults: () => MobileDesktopResult;
  resetMobileToDefaults: () => ResetMobileResult;
  switchToMobile: () => MobileDesktopResult;
  switchToDesktop: () => MobileDesktopResult;
  getMobileCapableProperties: () => string[];
}

export function useMobileDesktopManager(settingsObject: SettingsObject | null): UseMobileDesktopManagerResult {
  const getMobileDefaults = useCallback((): MobileDesktopResult => {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is not available",
      };
    }
    
    return MobileDesktopManager.getMobileDefaults(settingsObject);
  }, [settingsObject]);

  const resetMobileToDefaults = useCallback((): ResetMobileResult => {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is not available",
      };
    }
    
    return MobileDesktopManager.resetMobileToDefaults(settingsObject);
  }, [settingsObject]);

  const switchToMobile = useCallback((): MobileDesktopResult => {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is not available",
      };
    }
    
    return MobileDesktopManager.switchToMobile(settingsObject);
  }, [settingsObject]);

  const switchToDesktop = useCallback((): MobileDesktopResult => {
    if (!settingsObject) {
      return {
        success: false,
        error: "Settings object is not available",
      };
    }
    
    return MobileDesktopManager.switchToDesktop(settingsObject);
  }, [settingsObject]);

  const getMobileCapableProperties = useCallback((): string[] => {
    if (!settingsObject) {
      return [];
    }
    
    return MobileDesktopManager.getMobileCapableProperties(settingsObject);
  }, [settingsObject]);

  return {
    getMobileDefaults,
    resetMobileToDefaults,
    switchToMobile,
    switchToDesktop,
    getMobileCapableProperties,
  };
}

export default useMobileDesktopManager; 