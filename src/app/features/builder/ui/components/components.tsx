import { useState, useEffect, type JSX } from "react";
import ComponentsContent from "./components.content";
import { fetchFolders, type FolderEntry } from "./components.action";

interface Props {
  onSelectComponent: (component: string | null) => void;
}

export default function Components({ onSelectComponent }: Props): JSX.Element {
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
      onSelectComponent={onSelectComponent}
    />
  );
}
