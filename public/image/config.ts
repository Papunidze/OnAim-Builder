export type ImageCategory = "logo" | "icon";

export interface BaseImageConfig {
  priority?: boolean;
  src: string;
  alt: string;
  width: number;
  height: number;
  category: ImageCategory;
}

export type LogoVariant = "primary";
export interface LogoImageConfig extends BaseImageConfig {
  category: "logo";
  variant: LogoVariant;
}

export type IconType =
  | "mobile"
  | "desktop"
  | "undo"
  | "redo"
  | "reset"
  | "chevron";

export interface IconImageConfig extends BaseImageConfig {
  category: "icon";
  type: IconType;
}
export type ImageConfig = LogoImageConfig | IconImageConfig;

export const isLogoImage = (config: ImageConfig): config is LogoImageConfig =>
  config.category === "logo";

export const isIconImage = (config: ImageConfig): config is IconImageConfig =>
  config.category === "icon";
