import { useState, useCallback, useEffect } from "react";
import { copyService } from "../services/copy.service";
import type { CopyResult, UseCopyReturn } from "../types/copy-components.types";

export function useCopy(): UseCopyReturn {
  const [isCopying, setIsCopying] = useState(false);
  const [lastCopyResult, setLastCopyResult] = useState<CopyResult | null>(null);

  // Sync with service's global copying state
  useEffect((): (() => void) => {
    const updateCopyingState = (): void => {
      setIsCopying(copyService.isOperationInProgress());
    };

    // Set initial state
    updateCopyingState();

    // Listen to copy events to update state
    const unsubscribeStart = copyService.on("copyStarted", (): void => {
      setIsCopying(true);
    });

    const unsubscribeCopied = copyService.on("componentsCopied", (): void => {
      setIsCopying(false);
    });

    const unsubscribeFailed = copyService.on("copyFailed", (): void => {
      setIsCopying(false);
    });

    return (): void => {
      unsubscribeStart();
      unsubscribeCopied();
      unsubscribeFailed();
    };
  }, []);

  const copyToDesktop = useCallback(async (): Promise<CopyResult> => {
    // Immediate check to prevent duplicate execution
    if (copyService.isOperationInProgress()) {
      console.warn("⚠️ Copy to desktop blocked - operation already in progress");
      throw new Error("Copy operation already in progress");
    }
    
    try {
      const result = await copyService.copyToDesktop();
      setLastCopyResult(result);
      return result;
    } catch (error) {
      console.error("Copy to desktop failed:", error);
      throw error;
    }
  }, []);

  const copyToMobile = useCallback(async (): Promise<CopyResult> => {
    // Immediate check to prevent duplicate execution
    if (copyService.isOperationInProgress()) {
      console.warn("⚠️ Copy to mobile blocked - operation already in progress");
      throw new Error("Copy operation already in progress");
    }
    
    try {
      const result = await copyService.copyToMobile();
      setLastCopyResult(result);
      return result;
    } catch (error) {
      console.error("Copy to mobile failed:", error);
      throw error;
    }
  }, []);

  const copyBetweenViews = useCallback(async (
    from: "desktop" | "mobile",
    to: "desktop" | "mobile"
  ): Promise<CopyResult> => {
    // Immediate check to prevent duplicate execution
    if (copyService.isOperationInProgress()) {
      console.warn("⚠️ Copy between views blocked - operation already in progress");
      throw new Error("Copy operation already in progress");
    }
    
    try {
      const result = await copyService.copyBetweenViews(from, to);
      setLastCopyResult(result);
      return result;
    } catch (error) {
      console.error("Copy between views failed:", error);
      throw error;
    }
  }, []);

  return {
    copyToDesktop,
    copyToMobile,
    copyBetweenViews,
    isCopying,
    lastCopyResult,
  };
} 