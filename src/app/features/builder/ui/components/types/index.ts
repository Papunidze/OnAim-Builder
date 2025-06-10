export interface FolderEntry {
  name: string;
  prefix: string;
}

export interface ComponentsProps {
  viewMode: "desktop" | "mobile";
}

export interface ComponentsContentProps {
  folders: FolderEntry[];
  addComponent: (
    name: string,
    options?: {
      props?: Record<string, unknown>;
      styles?: Record<string, string>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }
  ) => Promise<void>;
}
