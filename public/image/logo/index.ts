import type { LogoVariant, LogoImageConfig } from "../config";

const PrimaryLogo = "/image/logo/onaim.png";

export const logoImages: Record<LogoVariant, LogoImageConfig> = {
  primary: {
    priority: true,
    src: PrimaryLogo,
    alt: "OnAim",
    width: 60,
    height: 60,
    category: "logo",
    variant: "primary",
  },
};

export default logoImages;
