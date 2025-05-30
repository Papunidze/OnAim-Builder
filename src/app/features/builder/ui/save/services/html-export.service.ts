import { builderService } from "@app-shared/services/builder";
import type { ComponentState } from "@app-shared/services/builder";
import {
  generateFilename,
  downloadFile,
  getComponentPrefix,
  extractComponentSettings,
  generateComponentCSS,
} from "../utils/save.utils";

export class HTMLBuildExportService {
  static generateHTMLHeader(
    projectName: string,
    viewMode: "desktop" | "mobile",
    components: ComponentState[]
  ): string {
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background-color: #f5f5f5;
    }
    
    .builder-container {
      max-width: ${viewMode === "desktop" ? "1200px" : "375px"};
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 20px;
      min-height: 500px;
    }
    
    .component-wrapper {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin: 16px 0;
      overflow: hidden;
    }
    
    .component-label {
      background: #f8f9fa;
      padding: 8px 12px;
      font-size: 12px;
      color: #666;
      border-bottom: 1px solid #e0e0e0;
      font-family: monospace;
    }
    
    .component-content {
      padding: 16px;
    }
    
    /* Component-specific styles */
`;

    components.forEach((component) => {
      const prefix = getComponentPrefix(component);
      const extractedSettings = extractComponentSettings(component);
      const elementSpecificCSS = generateComponentCSS(
        component,
        extractedSettings,
        prefix
      );

      if (elementSpecificCSS) {
        htmlContent += `    /* ${component.name} styles */\n`;
        htmlContent += `    ${elementSpecificCSS}\n\n`;
      }

      if (component.compiledData?.files) {
        const cssFile = component.compiledData.files.find(
          (file) => file.type === "style"
        );
        if (cssFile?.content) {
          htmlContent += `    /* ${component.name} CSS file */\n`;
          htmlContent += `    ${cssFile.content}\n\n`;
        }
      }
    });

    htmlContent += `  </style>
</head>`;

    return htmlContent;
  }

  static generateHTMLBody(
    projectName: string,
    viewMode: "desktop" | "mobile",
    components: ComponentState[]
  ): string {
    let htmlContent = `<body>
  <div class="builder-container">
    <h1>${projectName}</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>View Mode: ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</p>
    
    <div class="components-list">
`;

    components.forEach((component) => {
      const prefix = getComponentPrefix(component);

      htmlContent += `      <div class="component-wrapper">
        <div class="component-label">
          ${component.name} - Prefix: ${prefix}
        </div>
        <div class="component-content">
          <!-- Component ${component.name} would be rendered here -->
          <div class="${prefix}-container">
            <p><strong>Component:</strong> ${component.name}</p>
            <p><strong>ID:</strong> ${component.id}</p>
`;

      if (component.props && Object.keys(component.props).length > 0) {
        htmlContent += `            <div class="${prefix}-props">
              <h4>Component Properties:</h4>
              <ul>
`;
        Object.entries(component.props).forEach(([key, value]) => {
          htmlContent += `                <li><strong>${key}:</strong> ${JSON.stringify(value)}</li>\n`;
        });
        htmlContent += `              </ul>
            </div>
`;
      }

      if (component.position) {
        htmlContent += `            <p><strong>Position:</strong> x: ${component.position.x}, y: ${component.position.y}</p>\n`;
      }

      if (component.size) {
        htmlContent += `            <p><strong>Size:</strong> ${component.size.width}x${component.size.height}</p>\n`;
      }

      htmlContent += `          </div>
        </div>
      </div>
`;
    });

    htmlContent += `    </div>
  </div>`;

    return htmlContent;
  }

  static generateJavaScriptFooter(
    projectName: string,
    viewMode: "desktop" | "mobile",
    componentsCount: number
  ): string {
    return `  
  <script>
    // Generated build information
    const buildInfo = {
      projectName: "${projectName}",
      viewMode: "${viewMode}",
      buildTimestamp: "${new Date().toISOString()}",
      componentsCount: ${componentsCount}
    };
    
    console.log("Build Info:", buildInfo);
    
    // You can add interactive JavaScript here
    document.addEventListener('DOMContentLoaded', function() {
      console.log('${projectName} build loaded successfully');
    });
  </script>`;
  }

  static export(viewMode: "desktop" | "mobile"): void {
    const components = builderService.getLiveComponents(viewMode);

    if (components.length === 0) {
      alert("No components to build");
      return;
    }

    const projectName = builderService.getProjectName() || "Untitled Project";

    let htmlContent = this.generateHTMLHeader(
      projectName,
      viewMode,
      components
    );
    htmlContent += this.generateHTMLBody(projectName, viewMode, components);
    htmlContent += this.generateJavaScriptFooter(
      projectName,
      viewMode,
      components.length
    );
    htmlContent += `
</body>
</html>`;

    const filename = generateFilename({
      format: "build",
      viewMode,
      projectName,
    });
    downloadFile(htmlContent, filename, "text/html");
  }
}
