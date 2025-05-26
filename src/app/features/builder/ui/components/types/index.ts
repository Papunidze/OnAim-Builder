export interface FolderEntry {
  name: string;
  prefix: string;
}

export interface ComponentsProps {
  viewMode: "desktop" | "mobile";
}

export interface ComponentsContentProps {
  folders: FolderEntry[];
  addComponent: (name: string) => void;
}
