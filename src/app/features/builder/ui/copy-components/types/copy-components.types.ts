import type { ComponentState } from "@app-shared/services/builder";

export interface CopyOptions {
  includePosition?: boolean;
  includeSize?: boolean;
  includeStyles?: boolean;
  includeProps?: boolean;
  generateNewIds?: boolean;
}

export interface CopyResult {
  success: boolean;
  copiedCount: number;
  sourceViewMode: "desktop" | "mobile";
  targetViewMode: "desktop" | "mobile";
  components: ComponentState[];
}

export interface CopyServiceEvents {
  componentsCopied: CopyResult;
  copyStarted: { from: "desktop" | "mobile"; to: "desktop" | "mobile" };
  copyFailed: { error: string };
}

export interface UseCopyReturn {
  copyToDesktop: () => Promise<CopyResult>;
  copyToMobile: () => Promise<CopyResult>;
  copyBetweenViews: (from: "desktop" | "mobile", to: "desktop" | "mobile") => Promise<CopyResult>;
  isCopying: boolean;
  lastCopyResult: CopyResult | null;
}

export interface CopyComponentsProps {
  currentViewMode: "desktop" | "mobile";
  className?: string;
} 