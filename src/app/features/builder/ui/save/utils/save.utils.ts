import type { ComponentState } from "@app-shared/services/builder";
import { builderService } from "@app-shared/services/builder";
import { StylesRenderer } from "@app-features/builder/ui/property-adjustments/services/styles-render";
import type { ComponentExportData, ExportOptions } from "../types/save.types";

export const generateFilename = (options: ExportOptions): string => {
  const timestamp =
    options.timestamp ||
    new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);

  const projectName =
    options.projectName ||
    builderService.getProjectName() ||
    "Untitled Project";
  const formattedProjectName = projectName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();

  const extensions = {
    json: "json",
    source: "txt",
    build: "html",
  };

  return `${formattedProjectName}-${options.format}-${options.viewMode}-${timestamp}.${extensions[options.format]}`;
};

export const getComponentPrefix = (component: ComponentState): string => {
  return (
    component.compiledData?.files?.find(
      (file) => file.type === "style" || file.prefix
    )?.prefix || component.name
  );
};

export const extractComponentSettings = (
  component: ComponentState
): Record<string, unknown> => {
  if (component.props && Object.keys(component.props).length > 0) {
    return component.props as Record<string, unknown>;
  }

  let settingsObject = component.compiledData?.settingsObject as unknown;
  let extractedSettings = {};

  if (!settingsObject) {
    settingsObject = builderService.reconstructSettingsObject(component);
  }

  if (settingsObject) {
    try {
      if (
        typeof settingsObject === "object" &&
        settingsObject !== null &&
        "getJson" in settingsObject &&
        typeof (settingsObject as Record<string, unknown>).getJson ===
          "function"
      ) {
        const jsonResult = (
          (settingsObject as Record<string, unknown>).getJson as () => unknown
        )();
        if (typeof jsonResult === "string") {
          try {
            extractedSettings = JSON.parse(jsonResult);
          } catch {
            extractedSettings = {};
          }
        } else if (jsonResult && typeof jsonResult === "object") {
          extractedSettings = jsonResult as Record<string, unknown>;
        }
      } else if (
        typeof settingsObject === "object" &&
        settingsObject !== null &&
        "getValues" in settingsObject &&
        typeof (settingsObject as Record<string, unknown>).getValues ===
          "function"
      ) {
        extractedSettings =
          (
            (settingsObject as Record<string, unknown>)
              .getValues as () => unknown
          )() || {};
      } else {
        extractedSettings = settingsObject as Record<string, unknown>;
      }
    } catch {
      extractedSettings = {};
    }
  }

  return extractedSettings as Record<string, unknown>;
};

export const calculateGridPosition = (
  component: ComponentState,
  index: number
): [number, number] => {
  if (component.position) {
    const gridSize = 100;
    const row = Math.floor(component.position.y / gridSize);
    const col = Math.floor(component.position.x / gridSize);
    return [row, col];
  } else {
    const gridColumns = 10;
    const row = Math.floor(index / gridColumns);
    const col = index % gridColumns;
    return [row, col];
  }
};

export const generateComponentCSS = (
  component: ComponentState,
  settings: Record<string, unknown>,
  prefix: string
): string => {
  const componentStyles = component.styles || {};
  return StylesRenderer.generateCSS(
    settings,
    componentStyles as Record<string, string>,
    prefix
  );
};

export const transformComponentToExportData = (
  component: ComponentState,
  index: number
): ComponentExportData => {
  const prefix = getComponentPrefix(component);
  const extractedSettings = extractComponentSettings(component);
  const gridPosition = calculateGridPosition(component, index);
  const elementSpecificCSS = generateComponentCSS(
    component,
    extractedSettings,
    prefix
  );

  // Get component title from settings or fall back to name
  let componentTitle = component.name;
  if (extractedSettings.title && typeof extractedSettings.title === 'string') {
    componentTitle = extractedSettings.title;
  } else if (component.props?.title && typeof component.props.title === 'string') {
    componentTitle = component.props.title;
  }

  return {
    component: {
      id: component.id,
      name: component.name,
      prefix,
      title: componentTitle, // Include the component title
    },
    layout: {
      position: {
        grid: {
          row: gridPosition[0],
          column: gridPosition[1],
        },
        coordinates: component.position || { x: 0, y: 0 },
      },
      size: component.size || { width: 400, height: 300 }, // Provide default size
    },
    configuration: {
      settings: {
        ...extractedSettings,
        title: componentTitle, // Ensure title is in settings
      },
      props: {
        ...(component.props || {}),
        title: componentTitle, // Ensure title is in props
      },
      styles: component.styles || {},
      elementSpecificCSS,
    },
  };
};

export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string
): void => {
  const dataBlob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
