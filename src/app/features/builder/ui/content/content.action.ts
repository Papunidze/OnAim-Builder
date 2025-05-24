import { rest } from "@app-shared/services";

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

export const fetchComponents = (name: string): Promise<ContentFile[]> => {
  return rest.GET<FolderResponse>(`/file/folders/${name}`).then((res) => {
    if (res.status !== "success" && res.status !== "OK") {
      throw new Error(`API error: ${res.status}`);
    }
    return res.data;
  });
};
