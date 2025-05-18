import type { ImageConfig, ImageCategory } from "./config";
import iconImages from "./icon";
import logoImages from "./logo";

class ImageRegistry {
  private static instance: ImageRegistry;
  private registry: Map<string, ImageConfig> = new Map();

  private constructor() {
    this.initializeRegistry();
  }

  public static getInstance(): ImageRegistry {
    if (!ImageRegistry.instance) {
      ImageRegistry.instance = new ImageRegistry();
    }
    return ImageRegistry.instance;
  }

  private initializeRegistry(): void {
    Object.entries(logoImages).forEach(([key, config]) => {
      this.register(`logo:${key}`, config);
    });
    Object.entries(iconImages).forEach(([key, config]) => {
      this.register(`icon:${key}`, config);
    });
  }

  public register(key: string, config: ImageConfig): void {
    this.registry.set(key, config);
  }

  public get(key: string): ImageConfig | undefined {
    return this.registry.get(key);
  }

  public getByCategory(category: ImageCategory): ImageConfig[] {
    return Array.from(this.registry.values()).filter(
      (config) => config.category === category
    );
  }

  public getAllKeys(): string[] {
    return Array.from(this.registry.keys());
  }
}

export const imageRegistry = ImageRegistry.getInstance();
export default imageRegistry;
