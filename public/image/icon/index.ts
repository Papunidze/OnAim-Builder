import type { IconType, IconImageConfig } from "../config";

const DesktopIcon = "/image/icon/monitor.png";
const MobileIcon = "/image/icon/mobile.png";
const UndoIcon = "/image/icon/undo.png";
const RedoIcon = "/image/icon/redo.png";
const ResetIcon = "/image/icon/reset.png";
const ChevronIcon = "/image/icon/chevron.png";
export const iconImages: Record<IconType, IconImageConfig> = {
  desktop: {
    src: DesktopIcon,
    alt: "Desktop",
    width: 20,
    height: 20,
    category: "icon",
    type: "desktop",
  },
  mobile: {
    src: MobileIcon,
    alt: "Mobile",
    width: 20,
    height: 20,
    category: "icon",
    type: "mobile",
  },
  undo: {
    src: UndoIcon,
    alt: "undo",
    width: 20,
    height: 20,
    category: "icon",
    type: "undo",
  },
  redo: {
    src: RedoIcon,
    alt: "redo",
    width: 20,
    height: 20,
    category: "icon",
    type: "redo",
  },
  reset: {
    src: ResetIcon,
    alt: "reset",
    width: 20,
    height: 20,
    category: "icon",
    type: "reset",
  },
  chevron: {
    src: ChevronIcon,
    alt: "chevron",
    width: 20,
    height: 20,
    category: "icon",
    type: "chevron",
  },
};

export default iconImages;
