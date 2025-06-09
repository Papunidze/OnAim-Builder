import {
  SettingGroup,
  ColorSetting,
  StringSetting,
  WidthSetting,
  type SettingsToProps,
} from "builder-settings-types";

export const settings = new SettingGroup({
  title: "Leaderboard Settings",
  main: true,
  settings: {
    background: new ColorSetting({
      default: "255,255,255",
      title: "Background Color",
    }),
    title: new StringSetting({
      default: "Top Players",
      title: "Title",
    }),
    width: new WidthSetting({
      default: 400,
      title: "Width (px)",
    }),
    players: new StringSetting({
      default: "Player",
      title: "Players",
    }),
  },
});

export type Settings = SettingsToProps<typeof settings>;
export default settings;
