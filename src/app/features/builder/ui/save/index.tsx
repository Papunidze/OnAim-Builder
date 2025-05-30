import type { JSX } from "react";
import styles from "./save.module.css";
import { builderService } from "@app-shared/services/builder";
import type { ComponentState } from "@app-shared/services/builder";

interface SaveProps {
  viewMode: "desktop" | "mobile";
}

interface ComponentExportData {
  component: {
    id: string;
    name: string;
    prefix: string;
  };
  layout: {
    position: {
      grid: {
        row: number;
        column: number;
      };
      coordinates: { x: number; y: number };
    };
    size?: { width: number; height: number };
  };
  configuration: {
    settings: Record<string, unknown>;
    props: Record<string, unknown>;
    styles: Record<string, unknown>;
  };
}

interface SaveData {
  project: {
    metadata: {
      version: string;
      format: string;
      viewMode: string;
      exportTimestamp: string;
      lastModified: string;
      projectName: string;
      generator: string;
    };
    statistics: {
      components: {
        total: number;
        uniqueTypes: number;
        breakdown: { name: string; count: number }[];
      };
    };
  };
  components: ComponentExportData[];
}

const Save = ({ viewMode }: SaveProps): JSX.Element => {
  const generateSaveData = (): SaveData => {
    const components = builderService.getLiveComponents(viewMode);

    const extractComponentData = (components: ComponentState[]): ComponentExportData[] => {
      return components.map((component, index) => {
        const prefix =
          component.compiledData?.files?.find(
            (file) => file.type === "style" || file.prefix
          )?.prefix || component.name;

        const currentSettings = component.props || {};
        let settingsObject = component.compiledData?.settingsObject as unknown;
        let extractedSettings = {};

        if (!settingsObject) {
          settingsObject = builderService.reconstructSettingsObject(component);
        }

        if (settingsObject) {
          try {
            if (typeof settingsObject === 'object' && settingsObject !== null && 'getJson' in settingsObject && typeof (settingsObject as Record<string, unknown>).getJson === "function") {
              const jsonResult = ((settingsObject as Record<string, unknown>).getJson as () => unknown)();
              if (typeof jsonResult === "string") {
                try {
                  extractedSettings = JSON.parse(jsonResult);
                } catch {
                  extractedSettings = {};
                }
              } else if (jsonResult && typeof jsonResult === "object") {
                extractedSettings = jsonResult as Record<string, unknown>;
              }
            } else if (typeof settingsObject === 'object' && settingsObject !== null && 'getValues' in settingsObject && typeof (settingsObject as Record<string, unknown>).getValues === "function") {
              extractedSettings = ((settingsObject as Record<string, unknown>).getValues as () => unknown)() || {};
            } else {
              extractedSettings = settingsObject as Record<string, unknown>;
            }
          } catch {
            extractedSettings = {};
          }
        }

        let gridPosition: [number, number];
        if (component.position) {
          const gridSize = 100;
          const row = Math.floor(component.position.y / gridSize);
          const col = Math.floor(component.position.x / gridSize);
          gridPosition = [row, col];
        } else {
          const gridColumns = 10;
          const row = Math.floor(index / gridColumns);
          const col = index % gridColumns;
          gridPosition = [row, col];
        }
        return {
          component: {
            id: component.id,
            name: component.name,
            prefix,
          },
          layout: {
            position: {
              grid: {
                row: gridPosition[0],
                column: gridPosition[1],
              },
              coordinates: component.position || { x: 0, y: 0 },
            },
            size: component.size,
          },
          configuration: {
            settings: extractedSettings as Record<string, unknown>,
            props: currentSettings,
            styles: component.styles || {},
          },
        };
      });
    };
    const componentData = extractComponentData(components);
    const componentNames = [
      ...new Set(componentData.map((c) => c.component.name)),
    ];    const componentStats = componentNames.map((name) => {
      const count = componentData.filter(
        (c) => c.component.name === name
      ).length;
      return { name, count };
    });

    const saveData: SaveData = {
      project: {
        metadata: {
          version: "1.0.0",
          format: "OnAim Builder Export",
          viewMode,
          exportTimestamp: new Date().toISOString(),
          lastModified: new Date(
            builderService.getState().metadata.lastModified
          ).toISOString(),
          projectName: builderService.getProjectName() || "Untitled Project",
          generator: "OnAim Builder v1.0.0",
        },
        statistics: {
          components: {
            total: componentData.length,
            uniqueTypes: componentNames.length,
            breakdown: componentStats,
          },
        },
      },
      components: componentData,
    };

    return saveData;
  };
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    const saveData = generateSaveData();
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const projectName = saveData.project.metadata.projectName
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();

    const dataStr = JSON.stringify(saveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName}-${viewMode}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <button className={styles.builderHeaderSaveButton} onClick={handleClick}>
      Save
    </button>
  );
};

export default Save;
