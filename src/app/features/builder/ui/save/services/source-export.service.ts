import { builderService } from "@app-shared/services/builder";
import type { ComponentState } from "@app-shared/services/builder";
import type { SourceFiles, BuildManifest } from "../types/save.types";
import { generateFilename, downloadFile } from "../utils/save.utils";

export class SourceExportService {
  static generateSourceFiles(components: ComponentState[]): SourceFiles {
    const sourceFiles: SourceFiles = {};

    components.forEach((component) => {
      const componentName = component.name;

      if (component.compiledData?.files) {
        component.compiledData.files.forEach((file) => {
          const filePath = `${componentName}/${file.file}`;
          sourceFiles[filePath] = file.content;
        });
      }

      const configPath = `${componentName}/component-config.json`;
      sourceFiles[configPath] = JSON.stringify(
        {
          id: component.id,
          name: component.name,
          props: component.props,
          styles: component.styles,
          position: component.position,
          size: component.size,
          timestamp: component.timestamp,
        },
        null,
        2
      );
    });

    return sourceFiles;
  }

  static generateManifest(
    projectName: string,
    viewMode: "desktop" | "mobile",
    components: ComponentState[]
  ): BuildManifest {
    return {
      projectName,
      viewMode,
      exportTimestamp: new Date().toISOString(),
      components: components.map((c) => ({
        name: c.name,
        id: c.id,
        folder: c.name,
      })),
    };
  }

  static generateCombinedSource(
    projectName: string,
    viewMode: "desktop" | "mobile",
    sourceFiles: SourceFiles
  ): string {
    let combinedSource = `// ${projectName} - Component Sources\n`;
    combinedSource += `// Exported on: ${new Date().toISOString()}\n`;
    combinedSource += `// View Mode: ${viewMode}\n\n`;

    Object.entries(sourceFiles).forEach(([path, content]) => {
      combinedSource += `\n// ==================== ${path} ====================\n\n`;
      combinedSource += content;
      combinedSource += "\n";
    });

    return combinedSource;
  }

  static export(viewMode: "desktop" | "mobile"): void {
    const components = builderService.getLiveComponents(viewMode);

    if (components.length === 0) {
      alert("No components to download source for");
      return;
    }

    const projectName = builderService.getProjectName() || "Untitled Project";
    const sourceFiles = this.generateSourceFiles(components);
    const manifest = this.generateManifest(projectName, viewMode, components);

    sourceFiles["manifest.json"] = JSON.stringify(manifest, null, 2);

    const combinedSource = this.generateCombinedSource(
      projectName,
      viewMode,
      sourceFiles
    );
    const filename = generateFilename({
      format: "source",
      viewMode,
      projectName,
    });

    downloadFile(combinedSource, filename, "text/plain");
  }
}
