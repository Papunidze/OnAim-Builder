interface CSSRule {
  property: string;
  value: string;
}

interface ProcessedCSS {
  className: string;
  rules: CSSRule[];
}

export class StylesRenderer {
  private static readonly COLOR_PROPERTIES = [
    "color",
    "background",
    "backgroundColor",
    "borderColor",
    "outlineColor",
  ];
  private static readonly SIZE_PROPERTIES = [
    "width",
    "height",
    "minWidth",
    "minHeight",
    "maxWidth",
    "maxHeight",
    "padding",
    "margin",
    "borderWidth",
    "borderRadius",
    "fontSize",
    "lineHeight",
    "top",
    "bottom",
    "left",
    "right",
    "border-radius",
    "border-width",
    "border-size",
    "gap",
    "columnGap",
    "rowGap",
  ];

  private static readonly PERCENTAGE_PROPERTIES = ["opacity"];

  private static readonly COMPOUND_PROPERTIES = [
    "border",
    "borderTop",
    "borderRight",
    "borderBottom",
    "borderLeft",
    "boxShadow",
    "textShadow",
  ];

  public static generateCSS(
    componentProps: Record<string, unknown> = {},
    componentStyles: Record<string, string> = {},
    prefix: string
  ): string {
    const cssVariables: string[] = [];

    Object.entries(componentStyles).forEach(([key, value]) => {
      if (typeof value === "string") {
        cssVariables.push(`--${prefix}-${key}: ${value};`);
      }
    });

    const processedRules = this.processSettings(componentProps);

    if (processedRules.length === 0 && cssVariables.length === 0) {
      return "";
    }

    const groupedRules = this.groupRulesByComponent(processedRules);

    let cssOutput = "";

    groupedRules.forEach(({ className, rules }) => {
      const fullClassName = `${prefix}-${className}`;
      const allRules = [
        ...cssVariables,
        ...rules.map((rule) => `${rule.property}: ${rule.value};`),
      ];

      if (allRules.length > 0) {
        cssOutput += `.${fullClassName} {\n  ${allRules.join("\n  ")}\n}\n\n`;
      }
    });

    return cssOutput.trim();
  }

  private static processSettings(
    obj: Record<string, unknown>,
    keyPrefix: string = ""
  ): CSSRule[] {
    const rules: CSSRule[] = [];

    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = keyPrefix ? `${keyPrefix}-${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nestedRules = this.processSettings(
          value as Record<string, unknown>,
          fullKey
        );
        rules.push(...nestedRules);
      } else if (typeof value === "string" || typeof value === "number") {
        const processedValue = this.transformCSSValue(key, String(value));
        rules.push({
          property: fullKey,
          value: processedValue,
        });
      }
    });

    return rules;
  }
  private static transformCSSValue(key: string, value: string): string {
    if (this.COLOR_PROPERTIES.includes(key) && this.isRGBValue(value)) {
      return `rgb(${value})`;
    }

    if (this.COMPOUND_PROPERTIES.includes(key)) {
      return this.processCompoundProperty(key, value);
    }

    if (this.SIZE_PROPERTIES.includes(key) && this.shouldAddPixels(value)) {
      return `${value}px`;
    }

    if (
      this.PERCENTAGE_PROPERTIES.includes(key) &&
      this.isNumericValue(value)
    ) {
      return `calc(${value} / 100)`;
    }

    switch (key) {
      case "fontWeight":
        return this.normalizeFontWeight(value);
      case "textAlign":
        return this.normalizeTextAlign(value);
      case "display":
        return this.normalizeDisplay(value);
      default:
        return value;
    }
  }
  private static groupRulesByComponent(rules: CSSRule[]): ProcessedCSS[] {
    const grouped = new Map<string, CSSRule[]>();

    rules.forEach((rule) => {
      const componentKey = rule.property.split("-")[0];

      if (!grouped.has(componentKey)) {
        grouped.set(componentKey, []);
      }

      const simpleProp = rule.property.includes("-")
        ? rule.property.split("-").slice(1).join("-")
        : rule.property;

      grouped.get(componentKey)!.push({
        property: simpleProp,
        value: rule.value,
      });
    });

    return Array.from(grouped.entries()).map(([className, rules]) => ({
      className,
      rules: this.consolidateBorderProperties(rules),
    }));
  }

  private static isRGBValue(value: string): boolean {
    return /^\d+,\s*\d+,\s*\d+$/.test(value);
  }
  private static isNumericValue(value: string): boolean {
    return /^\d+$/.test(value);
  }
  private static shouldAddPixels(value: string): boolean {
    if (!this.isNumericValue(value)) {
      return false;
    }

    const hasUnits =
      /\d+(px|%|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/i.test(value);

    return !hasUnits;
  }

  /**
   * Process compound CSS properties like border, box-shadow, etc.
   */
  private static processCompoundProperty(key: string, value: string): string {
    switch (key) {
      case "border":
      case "borderTop":
      case "borderRight":
      case "borderBottom":
      case "borderLeft":
        return this.processBorderValue(value);
      case "boxShadow":
      case "textShadow":
        return this.processShadowValue(value);
      default:
        return value;
    }
  }

  private static processBorderValue(value: string): string {
    const parts = value.trim().split(/\s+/);

    if (parts.length < 3) {
      return value;
    }

    const [width, style, ...colorParts] = parts;
    const color = colorParts.join(" ");

    const processedWidth = this.isNumericValue(width) ? `${width}px` : width;

    const processedColor = this.isRGBValue(color) ? `rgb(${color})` : color;

    return `${processedWidth} ${style} ${processedColor}`;
  }
  /**
   * Process shadow values (basic implementation)
   */
  private static processShadowValue(value: string): string {
    // For now, return as-is. Can be enhanced later for RGB color support in shadows
    return value;
  }
  private static consolidateBorderProperties(rules: CSSRule[]): CSSRule[] {
    const borderProps = new Map<string, string>();
    const otherProps: CSSRule[] = [];

    rules.forEach((rule) => {
      if (rule.property.startsWith("border-")) {
        const borderProp = rule.property.replace("border-", "");
        borderProps.set(borderProp, rule.value);
      } else {
        otherProps.push(rule);
      }
    });

    if (borderProps.size > 0) {
      const rawWidth =
        borderProps.get("size") || borderProps.get("width") || "1";
      const width = this.shouldAddPixels(rawWidth) ? `${rawWidth}px` : rawWidth;
      const style = borderProps.get("style") || "solid";
      const rawColor = borderProps.get("color") || "#000";
      const color = this.isRGBValue(rawColor) ? `rgb(${rawColor})` : rawColor;

      const borderValue = `${width} ${style} ${color}`;
      otherProps.push({
        property: "border",
        value: borderValue,
      });

      if (borderProps.has("radius")) {
        const rawRadius = borderProps.get("radius")!;
        const radius = this.shouldAddPixels(rawRadius)
          ? `${rawRadius}px`
          : rawRadius;
        otherProps.push({
          property: "border-radius",
          value: radius,
        });
      }

      if (borderProps.has("opacity")) {
        const opacity = borderProps.get("opacity")!;
        if (opacity !== "calc(100 / 100)") {
          otherProps.push({
            property: "border-opacity",
            value: opacity,
          });
        }
      }
    }

    return otherProps;
  }

  private static normalizeFontWeight(value: string): string {
    const weightMap: Record<string, string> = {
      thin: "100",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    };

    return weightMap[value.toLowerCase()] || value;
  }

  private static normalizeTextAlign(value: string): string {
    const alignMap: Record<string, string> = {
      start: "left",
      end: "right",
    };

    return alignMap[value.toLowerCase()] || value;
  }

  private static normalizeDisplay(value: string): string {
    const displayMap: Record<string, string> = {
      show: "block",
      hide: "none",
    };

    return displayMap[value.toLowerCase()] || value;
  }

  public static addColorProperty(property: string): void {
    if (!this.COLOR_PROPERTIES.includes(property)) {
      this.COLOR_PROPERTIES.push(property);
    }
  }

  public static addSizeProperty(property: string): void {
    if (!this.SIZE_PROPERTIES.includes(property)) {
      this.SIZE_PROPERTIES.push(property);
    }
  }

  public static addPercentageProperty(property: string): void {
    if (!this.PERCENTAGE_PROPERTIES.includes(property)) {
      this.PERCENTAGE_PROPERTIES.push(property);
    }
  }
}

export default StylesRenderer;
