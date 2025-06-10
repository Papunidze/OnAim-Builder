import { useState, useEffect, type JSX } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import ComponentsContent from "./components.content";
import { fetchFolders } from "./api";
import type { ComponentsProps, FolderEntry } from "./types";

export default function Components({ viewMode }: ComponentsProps): JSX.Element {
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { addComponent } = useBuilder();

  useEffect(() => {
    fetchFolders()
      .then(setFolders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading…</div>;
  return (
    <ComponentsContent
      folders={folders}
      addComponent={async (name, options) => {
        try {
          await addComponent(name, viewMode, options);
        } catch (error) {
          console.error(`Failed to add component ${name}:`, error);
        }
      }}
    />
  );
}
