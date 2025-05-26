import { rest } from "@app-shared/services/api";

export interface FolderEntry {
  name: string;
  prefix: string;
}

export function fetchFolders(): Promise<FolderEntry[]> {
  return rest
    .GET<{ status: string; data: FolderEntry[] }>("/file/folders")
    .then((r) => r.data);
}
