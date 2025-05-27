import { rest } from "@app-shared/services/api";

export interface ContentFile {
  content: string;
  file: string;
  prefix: string;
  type: string;
}

interface FolderResponse {
  status: string;
  data: ContentFile[];
}

export const fetchComponents = async (
  name: string,
  uniqueId?: string
): Promise<ContentFile[]> => {
  try {
    if (!name || typeof name !== "string") {
      throw new Error("Component name is required and must be a string");
    }

    const queryParam = uniqueId ? `?uid=${encodeURIComponent(uniqueId)}` : "";
    const res = await rest.GET<FolderResponse>(
      `/file/folders/${name}${queryParam}`
    );

    if (!res) {
      throw new Error("No response received from server");
    }

    if (res.status !== "success" && res.status !== "OK") {
      throw new Error(`API error: ${res.status}`);
    }

    if (!Array.isArray(res.data)) {
      throw new Error("Invalid data format received from server");
    }

    return validateAndFilterFiles(res.data, name);
  } catch (error) {
    console.error(`Error fetching components for "${name}":`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

function validateAndFilterFiles(
  files: ContentFile[],
  componentName: string
): ContentFile[] {
  const validatedFiles = files.filter((file) => {
    if (!file.file || !file.content || !file.type) {
      return false;
    }
    return true;
  });

  if (validatedFiles.length === 0) {
    throw new Error(`No valid files found for component: ${componentName}`);
  }

  const scripts = validatedFiles.filter((f) => f.type === "script");

  if (scripts.length === 0) {
    throw new Error(`No script files found for component: ${componentName}`);
  }

  return validatedFiles;
}
