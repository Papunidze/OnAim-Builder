import React, { useState, useEffect, type JSX, useCallback } from "react";
import { ReaderService } from "@app-shared/services";
import DesktopContent from "./desktop/desktop-content";
import MobileContent from "./mobile/mobil-content";
import { fetchComponents, type ContentFile } from "./content.action";
import type { FileData } from "@app-shared/services/reader/reader";

interface ContentRendererProps {
  componentNames: string[];
  viewMode: "desktop" | "mobile";
}

interface InstanceState {
  name: string;
  status: "idle" | "loading" | "loaded" | "error";
  Comp?: React.ComponentType<unknown> | null;
  style?: string;
  error?: string;
}

const ContentRenderer = ({
  componentNames,
  viewMode,
}: ContentRendererProps): JSX.Element | null => {
  const [instanceStates, setInstanceStates] = useState<InstanceState[]>([]);

  const fetchAndSetComponentInstance = useCallback(
    async (componentName: string, index: number) => {
      setInstanceStates((prevInstances) => {
        const newInstances = [...prevInstances];
        if (newInstances[index]?.status !== "loading") {
          newInstances[index] = {
            ...newInstances[index],
            name: componentName,
            status: "loading" as const,
          };
          return newInstances;
        }
        return prevInstances;
      });

      try {
        const files: ContentFile[] = await fetchComponents(componentName);
        const fileData: FileData[] = files.map((f) => ({
          file: f.file,
          type: f.type as "script" | "style",
          content: f.content,
          prefix: f.prefix,
        }));
        const reader = new ReaderService(fileData);
        const stylesArr = reader.getAllStyles();
        const componentStyleContent = stylesArr
          .map((s) => s.content)
          .join("\n");
        const script = reader.getScriptContent("index.tsx");
        if (!script)
          throw new Error(
            `index.tsx not found for ${componentName} at index ${index}`
          );
        const Comp = reader.getReactComponentFromString(script, componentName);
        if (!Comp)
          throw new Error(
            `Failed to evaluate component ${componentName} at index ${index}`
          );

        setInstanceStates((prevInstances) => {
          const newInstances = [...prevInstances];
          newInstances[index] = {
            name: componentName,
            status: "loaded" as const,
            Comp,
            style: componentStyleContent,
          };
          return newInstances;
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setInstanceStates((prevInstances) => {
          const newInstances = [...prevInstances];
          newInstances[index] = {
            ...(prevInstances[index] || {}),
            name: componentName,
            status: "error" as const,
            error: errorMessage,
            Comp: prevInstances[index]?.Comp,
            style: prevInstances[index]?.style,
          };
          return newInstances;
        });
      }
    },
    []
  );

  useEffect(() => {
    setInstanceStates((prevInstances) => {
      const newLength = componentNames.length;
      const oldLength = prevInstances.length;
      const newInstances = new Array(newLength).fill(null).map((_, i) => {
        const currentName = componentNames[i];
        const oldInstance = i < oldLength ? prevInstances[i] : null;

        if (!oldInstance || oldInstance.name !== currentName) {
          return {
            name: currentName,
            status: "idle" as const,
          };
        }

        return oldInstance;
      });
      return newInstances;
    });
  }, [componentNames]);

  useEffect(() => {
    instanceStates.forEach((instance, index) => {
      if (instance.status === "idle") {
        fetchAndSetComponentInstance(instance.name, index);
      }
    });
  }, [instanceStates, fetchAndSetComponentInstance]);

  const aggregatedStyleContent = instanceStates
    .filter((instance) => instance.status === "loaded" && instance.style)
    .map((instance) => instance.style)
    .join("\n");

  if (componentNames.length === 0) {
    return <div>No components to render.</div>;
  }

  const content = (
    <>
      {aggregatedStyleContent && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyleContent }} />
      )}
      {instanceStates.map((instance, index) => {
        const key = `${instance.name}-${index}`;

        if (instance.status === "idle" || instance.status === "loading") {
          return <div key={key}>Loading {instance.name}...</div>;
        }
        if (instance.status === "error") {
          return (
            <div key={key} style={{ color: "red" }}>
              Error loading {instance.name}: {instance.error}
              {instance.Comp && <instance.Comp />}
            </div>
          );
        }
        if (instance.status === "loaded" && instance.Comp) {
          const Component = instance.Comp;
          return <Component key={key} />;
        }
        return <div key={key}>Preparing {instance.name}...</div>;
      })}
    </>
  );

  return viewMode === "desktop" ? (
    <DesktopContent>{content}</DesktopContent>
  ) : (
    <MobileContent>{content}</MobileContent>
  );
};

export default ContentRenderer;
