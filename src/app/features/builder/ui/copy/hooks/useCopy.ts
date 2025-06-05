import { useCallback, useState } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { copyService, type CopyOptions } from "../services/copy.service";

export interface UseCopyReturn {
  copyComponents: (
    fromMode: "desktop" | "mobile",
    toMode: "desktop" | "mobile",
    options?: CopyOptions
  ) => Promise<boolean>;
  isCoying: boolean;
  lastCopyResult: {
    success: boolean;
    componentCount: number;
    error?: string;
  } | null;
  canCopyFromMode: (mode: "desktop" | "mobile") => boolean;
  getCopyPreview: (
    fromMode: "desktop" | "mobile",
    toMode: "desktop" | "mobile"
  ) => {
    canCopy: boolean;
    componentCount: number;
    uniqueComponentTypes: string[];
    hasCustomStyles: boolean;
    hasCustomProps: boolean;
    reason?: string;
  };
}

export function useCopy(): UseCopyReturn {
  const { getComponents, copyComponents: builderCopyComponents } = useBuilder();
  const [isCoying, setIsCoying] = useState(false);
  const [lastCopyResult, setLastCopyResult] = useState<{
    success: boolean;
    componentCount: number;
    error?: string;
  } | null>(null);

  const copyComponents = useCallback(
    async (
      fromMode: "desktop" | "mobile",
      toMode: "desktop" | "mobile",
      options: CopyOptions = {}
    ): Promise<boolean> => {
      if (isCoying) {
        return false;
      }

      setIsCoying(true);

      try {
        const sourceComponents = getComponents(fromMode);

        const result = copyService.copyComponents(
          sourceComponents,
          fromMode,
          toMode,
          options
        );

        if (result.success) {
          builderCopyComponents(fromMode, toMode);

          setLastCopyResult({
            success: true,
            componentCount: result.copiedComponents.length,
          });

          return true;
        } else {
          setLastCopyResult({
            success: false,
            componentCount: 0,
            error: result.error,
          });

          return false;
        }
      } catch (error) {
        setLastCopyResult({
          success: false,
          componentCount: 0,
          error: `Copy operation failed: ${(error as Error).message}`,
        });

        return false;
      } finally {
        setIsCoying(false);
      }
    },
    [isCoying, getComponents, builderCopyComponents]
  );

  const canCopyFromMode = useCallback(
    (mode: "desktop" | "mobile"): boolean => {
      const components = getComponents(mode);
      return components.length > 0;
    },
    [getComponents]
  );

  const getCopyPreview = useCallback(
    (fromMode: "desktop" | "mobile", toMode: "desktop" | "mobile") => {
      const sourceComponents = getComponents(fromMode);
      return copyService.getCopyPreview(sourceComponents, fromMode, toMode);
    },
    [getComponents]
  );

  return {
    copyComponents,
    isCoying,
    lastCopyResult,
    canCopyFromMode,
    getCopyPreview,
  };
}
