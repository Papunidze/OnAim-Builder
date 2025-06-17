import { useState, useEffect, useCallback, memo, type JSX } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { logger } from "@app-shared/utils/logger";
import ComponentsContent from "./components.content";
import { fetchFolders } from "./api";
import type { ComponentsProps, FolderEntry } from "./types";

const Components = memo(function Components({
  viewMode,
}: ComponentsProps): JSX.Element {
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { addComponent } = useBuilder();

  useEffect(() => {
    fetchFolders()
      .then(setFolders)
      .catch((error) => logger.error("Failed to fetch folders:", error))
      .finally(() => setLoading(false));
  }, []);

  const handleAddComponent = useCallback(
    async (
      name: string,
      options?: {
        props?: Record<string, unknown>;
        styles?: Record<string, string>;
        position?: { x: number; y: number };
        size?: { width: number; height: number };
      }
    ) => {
      try {
        await addComponent(name, viewMode, options);
      } catch (error) {
        logger.error(`Failed to add component ${name}:`, error);
      }
    },
    [addComponent, viewMode]
  );

  if (loading) return <div>Loading…</div>;

  return (
    <ComponentsContent folders={folders} addComponent={handleAddComponent} />
  );
});

export default Components;
