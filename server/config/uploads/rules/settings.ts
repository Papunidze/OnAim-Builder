import {
  SettingGroup,
  ColorSetting,
  StringSetting,
  WidthSetting,
  type SettingsToProps,
} from "builder-settings-types";

export const settings = new SettingGroup({
  title: "Rules Settings",
  main: true,
  settings: {
    background: new ColorSetting({
      default: "240,240,240",
      title: "Background Color",
    }),
    title: new StringSetting({
      default: "Game Rules",
      title: "Title",
    }),
    width: new WidthSetting({
      default: 400,
      title: "Width (px)",
    }),
    rules: new StringSetting({
      default: "Rule 1\nRule 2\nRule 3",
      title: "Rules List",
    }),
  },
});

export type Settings = SettingsToProps<typeof settings>;
export default settings;
