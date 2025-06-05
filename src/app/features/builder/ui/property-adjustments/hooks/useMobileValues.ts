import { useCallback, useState } from "react";
import {
  MobileValuesService,
  type MobileValuesResult,
  type SetMobileValuesResult,
} from "../services";
import type { SettingsObject } from "../services/settings-compiler";

interface UseMobileValuesReturn {
  getMobileValues: (
    settingsObject: SettingsObject
  ) => Promise<MobileValuesResult>;
  setMobileValues: (
    settingsObject: SettingsObject,
    values: Record<string, unknown>
  ) => Promise<SetMobileValuesResult>;
  applyMobileValues: (
    settingsObject: SettingsObject,
    viewMode: "desktop" | "mobile",
    onUpdate?: (values: Record<string, unknown>) => void
  ) => Promise<MobileValuesResult>;
  getFilteredMobileValues: (
    settingsObject: SettingsObject
  ) => Promise<MobileValuesResult>;
  supportsMobileValues: (settingsObject: SettingsObject) => boolean;
  isLoading: boolean;
  error: string | null;
}

export function useMobileValues(): UseMobileValuesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMobileValues = useCallback(
    async (settingsObject: SettingsObject): Promise<MobileValuesResult> => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const result = MobileValuesService.getMobileValues(settingsObject);

        if (!result.success) {
          setError(result.error || "Failed to get mobile values");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setMobileValues = useCallback(
    async (
      settingsObject: SettingsObject,
      values: Record<string, unknown>
    ): Promise<SetMobileValuesResult> => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const result = MobileValuesService.setMobileValues(
          settingsObject,
          values
        );

        if (!result.success) {
          setError(result.error || "Failed to set mobile values");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const applyMobileValues = useCallback(
    async (
      settingsObject: SettingsObject,
      viewMode: "desktop" | "mobile",
      onUpdate?: (values: Record<string, unknown>) => void
    ): Promise<MobileValuesResult> => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const result = MobileValuesService.applyMobileValues(
          settingsObject,
          viewMode,
          onUpdate
        );

        if (!result.success) {
          setError(result.error || "Failed to apply mobile values");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const supportsMobileValues = useCallback(
    (settingsObject: SettingsObject): boolean => {
      return MobileValuesService.supportsMobileValues(settingsObject);
    },
    []
  );

  const getFilteredMobileValues = useCallback(
    async (settingsObject: SettingsObject): Promise<MobileValuesResult> => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const result =
          MobileValuesService.getFilteredMobileValues(settingsObject);

        if (!result.success) {
          setError(result.error || "Failed to get filtered mobile values");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    getMobileValues,
    setMobileValues,
    applyMobileValues,
    getFilteredMobileValues,
    supportsMobileValues,
    isLoading,
    error,
  };
}

export default useMobileValues;
