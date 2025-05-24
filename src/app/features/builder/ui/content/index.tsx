import React, { useState, useEffect, type JSX } from "react";
import { fetchComponents, type ContentFile } from "./content.action";
import { ReaderService, type FileData } from "@app-shared/services";
import DesktopContent from "./desktop/desktop-content";
import MobileContent from "./mobile/mobil-content";

interface ContentRendererProps {
  componentName: string | null;
  viewMode: "desktop" | "mobile";
}

const ContentRenderer = ({
  componentName,
  viewMode,
}: ContentRendererProps): JSX.Element => {
  const [reader, setReader] = useState<ReaderService | null>(null);
  const [ComponentToRender, setComponentToRender] =
    useState<React.ComponentType<unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!componentName) return;
    setIsLoading(true);
    setError(null);

    fetchComponents(componentName)
      .then((files: ContentFile[]) => {
        const fd: FileData[] = files.map((f) => ({
          file: f.file,
          type: f.type as "script" | "style",
          content: f.content,
          prefix: f.prefix,
        }));
        setReader(new ReaderService(fd));
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setIsLoading(false));
  }, [componentName]);

  useEffect(() => {
    if (!reader) return;
    setIsLoading(true);
    setError(null);

    const styles = reader.getAllStyles();
    let tag = document.getElementById("dynamic-styles") as HTMLStyleElement;
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "dynamic-styles";
      document.head.appendChild(tag);
    }
    tag.innerHTML = styles.map((s) => s.content).join("\n");

    const js = reader.getScriptContent("index.tsx");
    if (!js) {
      setError("index.tsx not found");
      setIsLoading(false);
      return;
    }

    const Comp = reader.getReactComponentFromString(js, "index.tsx");
    if (!Comp) {
      setError("Failed to evaluate React component");
    } else {
      setComponentToRender(() => Comp);
    }
    setIsLoading(false);
  }, [reader]);

  if (isLoading) {
    return <div>Loading component…</div>;
  }
  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }
  if (ComponentToRender) {
    return viewMode === "desktop" ? (
      <DesktopContent>
        <ComponentToRender />
      </DesktopContent>
    ) : (
      <MobileContent>
        <ComponentToRender />
      </MobileContent>
    );
  }

  return <div>No component loaded</div>;
};

export default ContentRenderer;
