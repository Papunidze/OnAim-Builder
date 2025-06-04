import { api, rest } from "@app-shared/services/api";

export interface ComponentDownloadResponse {
  status: string;
  message?: string;
}

export interface ComponentCheckResponse {
  status: string;
  data: {
    exists: boolean;
    componentName: string;
    files?: string[];
    hasSettings?: boolean;
    hasComponent?: boolean;
    hasCss?: boolean;
  };
}

export const checkComponentExists = async (
  componentName: string
): Promise<ComponentCheckResponse["data"]> => {
  try {
    if (!componentName || typeof componentName !== "string") {
      throw new Error("Component name is required and must be a string");
    }

    const response = await rest.GET<ComponentCheckResponse>(
      `/file/check/${encodeURIComponent(componentName)}`
    );

    if (!response) {
      throw new Error("No response received from server");
    }

    if (response.status !== "success") {
      throw new Error(`API error: ${response.status}`);
    }

    return response.data;
  } catch {
    return {
      exists: false,
      componentName,
    };
  }
};

export const downloadMultipleComponentsSources = async (
  componentNames: string[],
  componentPropsMap?: Record<string, Record<string, unknown>>,
  componentLanguageMap?: Record<string, Record<string, Record<string, string>>>,
  viewMode?: "desktop" | "mobile"
): Promise<void> => {
  try {
    if (!Array.isArray(componentNames) || componentNames.length === 0) {
      throw new Error("At least one component name is required");
    }

    const endpoint = `/file/download-multiple`;
    const filename = `multiple_components_${Date.now()}.zip`;
    await api.downloadFile(endpoint, filename, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        componentNames,
        componentPropsMap: componentPropsMap || {},
        componentLanguageMap: componentLanguageMap || {},
        viewMode: viewMode || "desktop",
      },
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to download component sources"
    );
  }
};
