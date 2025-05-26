import { rest } from "@app-shared/services/api";
import type { FolderEntry } from "../types/index";

interface FolderResponse {
  status: string;
  data: FolderEntry[];
}

export async function fetchFolders(): Promise<FolderEntry[]> {
  try {
    const response = await rest.GET<FolderResponse>("/file/folders");

    if (!response) {
      throw new Error("No response received from server");
    }

    if (response.status !== "success" && response.status !== "OK") {
      throw new Error(`API error: ${response.status}`);
    }

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid data format received from server");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching component folders:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}
