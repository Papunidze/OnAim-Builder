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
  } catch (error) {
    console.error("Component check failed:", error);
    return {
      exists: false,
      componentName,
    };
  }
};

export const downloadComponentSource = async (
  componentName: string,
  componentProps?: Record<string, unknown>
): Promise<void> => {
  try {
    if (!componentName || typeof componentName !== "string") {
      throw new Error("Component name is required and must be a string");
    }

    const endpoint = `/file/download/${encodeURIComponent(componentName)}`;
    const filename = `${componentName}_source_${Date.now()}.zip`;

    if (componentProps && Object.keys(componentProps).length > 0) {
      await api.downloadFile(endpoint, filename, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: { componentProps },
      });
    } else {
      await api.downloadFile(endpoint, filename, {
        method: "GET",
      });
    }
  } catch (error) {
    console.error("Download failed:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to download component source"
    );
  }
};

export const downloadMultipleComponentsSources = async (
  componentNames: string[],
  componentPropsMap?: Record<string, Record<string, unknown>>
): Promise<void> => {
  try {
    if (!Array.isArray(componentNames) || componentNames.length === 0) {
      throw new Error("At least one component name is required");
    }

    const downloadPromises = componentNames.map((name) => {
      const componentProps = componentPropsMap
        ? componentPropsMap[name]
        : undefined;
      return downloadComponentSource(name, componentProps);
    });

    await Promise.all(downloadPromises);
  } catch (error) {
    console.error("Multiple downloads failed:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to download component sources"
    );
  }
};
