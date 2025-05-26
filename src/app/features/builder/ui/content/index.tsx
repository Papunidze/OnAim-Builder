import React, { useState, useEffect, type JSX, useCallback } from "react";
import DesktopContent from "./desktop/desktop-content";
import MobileContent from "./mobile/mobil-content";
import { fetchComponents, type ContentFile } from "./content.action";
import {
  EnhancedReaderService,
  type FileData,
} from "@app-shared/services/reader";
import { ErrorBoundary } from "@app-shared/components";
import type { ComponentState } from "@app-shared/services/builder";

interface ContentRendererProps {
  components: ComponentState[];
  viewMode: "desktop" | "mobile";
}

interface ComponentInstanceState {
  id: string;
  name: string;
  status: "idle" | "loading" | "loaded" | "error";
  Comp?: React.ComponentType<unknown> | null;
  style?: string;
  error?: string;
  retryCount?: number;
  prefix?: string; // Add prefix field to track unique styling prefix
}

// Constants
const MAX_RETRY_COUNT = 3;
const SCRIPT_PATTERNS = ["index.tsx", "index.ts", "index.jsx", "index.js"];

// Helper functions
const createIdleState = (id: string, name: string): ComponentInstanceState => ({
  id,
  name,
  status: "idle" as const,
  retryCount: 0,
});

const createLoadingState = (
  prevState: ComponentInstanceState | null,
  id: string,
  name: string
): ComponentInstanceState => ({
  ...prevState,
  id,
  name,
  status: "loading" as const,
  retryCount: prevState?.retryCount || 0,
});

const createLoadedState = (
  id: string,
  name: string,
  Comp: React.ComponentType<unknown>,
  style: string,
  prefix: string
): ComponentInstanceState => ({
  id,
  name,
  status: "loaded" as const,
  Comp,
  style,
  prefix,
  retryCount: 0,
});

const createErrorState = (
  prevState: ComponentInstanceState | null,
  id: string,
  name: string,
  error: string
): ComponentInstanceState => ({
  ...(prevState || {}),
  id,
  name,
  status: "error" as const,
  error,
  retryCount: (prevState?.retryCount || 0) + 1,
  Comp: prevState?.Comp,
  style: prevState?.style,
});

const getScriptContent = (
  reader: EnhancedReaderService,
  componentName: string
): { script: string; usedPattern: string } => {
  const patterns = [
    ...SCRIPT_PATTERNS,
    `${componentName}.tsx`,
    `${componentName}.ts`,
  ];

  for (const pattern of patterns) {
    const script = reader.getScriptContent(pattern);
    if (script) {
      return { script, usedPattern: pattern };
    }
  }

  // Fallback to first available script
  const allScripts = reader.getAllScripts();
  if (allScripts.length > 0) {
    return {
      script: allScripts[0].content,
      usedPattern: allScripts[0].file,
    };
  }

  throw new Error(`No script file found for ${componentName}`);
};

const ContentRenderer = ({
  components,
  viewMode,
}: ContentRendererProps): JSX.Element | null => {
  const [instanceStates, setInstanceStates] = useState<
    ComponentInstanceState[]
  >([]);
  const fetchAndSetComponentInstance = useCallback(
    async (componentId: string, componentName: string, index: number) => {
      setInstanceStates((prevInstances) => {
        const newInstances = [...prevInstances];
        if (newInstances[index]?.status === "loading") {
          return prevInstances;
        }
        newInstances[index] = createLoadingState(
          newInstances[index],
          componentId,
          componentName
        );
        return newInstances;
      });
      try {
        const files: ContentFile[] = await fetchComponents(
          componentName,
          componentId
        );

        if (!files || files.length === 0) {
          throw new Error(`No files found for component: ${componentName}`);
        }
        const fileData: FileData[] = files.map((f) => ({
          file: f.file,
          type: f.type as "script" | "style",
          content: f.content,
          prefix: f.prefix, // Now this should already be unique from the server
        }));
        const reader = new EnhancedReaderService(fileData);

        // Get all styles
        const stylesArr = reader.getAllStyles();
        const componentStyleContent = stylesArr
          .map((s) => s.content)
          .join("\n");

        const { script, usedPattern } = getScriptContent(reader, componentName);

        if (!script) {
          throw new Error(
            `No script file found for ${componentName}. Available files: ${fileData.map((f) => f.file).join(", ")}`
          );
        }
        const Comp = reader.getReactComponentFromString(
          script,
          usedPattern || componentName
        );

        if (!Comp) {
          throw new Error(
            `Failed to evaluate component from ${usedPattern || "script"} for ${componentName}`
          );
        }
        setInstanceStates((prevInstances) => {
          const newInstances = [...prevInstances];
          const prefix =
            fileData.find((f) => f.type === "style")?.prefix ||
            `${componentName}_${componentId}`;
          newInstances[index] = createLoadedState(
            componentId,
            componentName,
            Comp,
            componentStyleContent,
            prefix
          );
          return newInstances;
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";

        console.error(`Error loading component ${componentName}:`, err);
        setInstanceStates((prevInstances) => {
          const newInstances = [...prevInstances];
          newInstances[index] = createErrorState(
            prevInstances[index],
            componentId,
            componentName,
            errorMessage
          );
          return newInstances;
        });
      }
    },
    []
  );
  useEffect(() => {
    setInstanceStates((prevInstances) => {
      const newInstances = components.map((component) => {
        // Look for existing instance with same ID
        const existingInstance = prevInstances.find(
          (inst) => inst.id === component.id
        );

        if (existingInstance) {
          // Return existing instance if it matches the component ID
          return existingInstance;
        }

        // Create new idle state for new component
        return createIdleState(component.id, component.name);
      });

      return newInstances;
    });
  }, [components]);
  useEffect(() => {
    instanceStates.forEach((instance, index) => {
      if (instance.status === "idle") {
        fetchAndSetComponentInstance(instance.id, instance.name, index);
      }
    });
  }, [instanceStates, fetchAndSetComponentInstance]);

  const aggregatedStyleContent = instanceStates
    .filter((instance) => instance.status === "loaded" && instance.style)
    .map((instance) => instance.style)
    .join("\n");
  if (components.length === 0) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          color: "#666",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          margin: "16px",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
          No Components Selected
        </h3>
        <p style={{ margin: 0, fontSize: "14px" }}>
          Choose components from the sidebar to preview them here.
        </p>
      </div>
    );
  }
  const content = (
    <>
      {aggregatedStyleContent && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyleContent }} />
      )}{" "}
      {instanceStates.map((instance, index) => {
        const key = `${instance.id}-${instance.name}`; // Use unique ID for better React rendering

        if (instance.status === "idle" || instance.status === "loading") {
          return (
            <div key={key} style={{ padding: "16px", textAlign: "center" }}>
              Loading {instance.name}...
            </div>
          );
        }

        if (instance.status === "error") {
          const retryCount = instance.retryCount || 0;
          const canRetry = retryCount < MAX_RETRY_COUNT;

          return (
            <div
              key={key}
              style={{
                color: "red",
                padding: "16px",
                border: "1px solid #ff6b6b",
                borderRadius: "4px",
                margin: "8px 0",
                backgroundColor: "#fff5f5",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Error loading {instance.name}:
              </div>
              <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                {instance.error}
              </div>
              {canRetry && (
                <button
                  onClick={() =>
                    fetchAndSetComponentInstance(
                      instance.id,
                      instance.name,
                      index
                    )
                  }
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#ff6b6b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Retry ({retryCount}/{MAX_RETRY_COUNT})
                </button>
              )}
              {instance.Comp && (
                <div
                  style={{
                    marginTop: "8px",
                    borderTop: "1px solid #ddd",
                    paddingTop: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Fallback to previous version:
                  </div>
                  <instance.Comp />
                </div>
              )}
            </div>
          );
        }
        if (instance.status === "loaded" && instance.Comp) {
          const Component = instance.Comp;
          return (
            <ErrorBoundary
              key={key}
              componentName={instance.name}
              fallback={(error) => (
                <div
                  style={{
                    color: "orange",
                    padding: "16px",
                    border: "1px solid #ffa500",
                    borderRadius: "4px",
                    margin: "8px 0",
                    backgroundColor: "#fff8f0",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                    Render Error in {instance.name}:
                  </div>
                  <div style={{ fontSize: "14px" }}>{error.message}</div>
                </div>
              )}
            >
              <div
                style={{
                  border: "1px dashed #ccc",
                  margin: "8px 0",
                  padding: "8px",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                {" "}
                <div
                  style={{
                    position: "absolute",
                    top: "-8px",
                    left: "8px",
                    backgroundColor: "#f0f0f0",
                    padding: "2px 6px",
                    fontSize: "10px",
                    color: "#666",
                    borderRadius: "3px",
                  }}
                >
                  {instance.name} - Prefix: {instance.prefix || "N/A"}
                </div>
                <Component />
              </div>
            </ErrorBoundary>
          );
        }

        return (
          <div
            key={key}
            style={{ padding: "16px", textAlign: "center", color: "#666" }}
          >
            Preparing {instance.name}...
          </div>
        );
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
