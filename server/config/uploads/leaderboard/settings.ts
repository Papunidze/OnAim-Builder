import {
  SettingGroup,
  ColorSetting,
  StringSetting,
  WidthSetting,
  type SettingsToProps,
} from "builder-settings-types";

export const settings = new SettingGroup({
  title: "Leaderboard Styles",
  main: true,
  settings: {
    color: new ColorSetting({
      default: "15, 84, 42",
      title: "Text Color",
    }),

    background: new ColorSetting({
      default: "15, 84, 42",
      title: "Background Color",
    }),

    borderRadius: new StringSetting({
      default: "8px",
      title: "Border Radius",
    }),
    width: new WidthSetting({
      default: 820,
      title: "Width (px)",
    }),
  },
});

export type Settings = SettingsToProps<typeof settings>;
export default settings;
