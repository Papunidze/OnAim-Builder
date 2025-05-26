import { isLogoImage, type ImageConfig } from "@images/config";
import { imageRegistry } from "@images/registry";
import { type JSX } from "react";

import type { ImageProps } from "./image.interfaces";

import "./image.css";

export const Image = ({
  imageKey,
  size,
  width,
  height,
  className,
  onClick,
  alt,
  objectFit = "contain",
}: ImageProps): JSX.Element | null => {
  const config = imageRegistry.get(imageKey);
  if (!config) {
    return null;
  }

  const getWrapperClassName = (config: ImageConfig): string => {
    const classes = ["wrapper"];
    if (config.category) {
      classes.push(config.category);
      if (isLogoImage(config) && config.variant) {
        classes.push(config.variant);
      }
    }
    return classes.join(" ");
  };

  const finalWidth = size || width || config.width;
  const finalHeight = size || height || config.height;

  return (
    <div
      className={`${getWrapperClassName(config)} ${className || ""}`.trim()}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <img
        src={config.src as string}
        alt={alt || config.alt}
        width={finalWidth}
        height={finalHeight}
        className="image"
        style={{ objectFit }}
        loading={config.priority ? "eager" : undefined}
      />
    </div>
  );
};

export default Image;
