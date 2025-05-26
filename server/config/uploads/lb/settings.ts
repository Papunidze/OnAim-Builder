import {
  ColorSetting,
  SettingGroup,
  WidthSetting,
} from "builder-settings-types";

export const oa_settings = new SettingGroup({
  title: "Settings",
  main: true,
  settings: {
    color: new ColorSetting({
      default: "255,255,255",
      title: "background",
    }),
    width: new WidthSetting({
      default: 860,
      mobile: 370,
      title: "width",
    }),
  },
});
