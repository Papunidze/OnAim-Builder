import {
  BorderSettingSet,
  ColorSetting,
  OpacitySetting,
  SettingGroup,
  StringSetting,
  WidthSetting,
  SettingsToProps,
} from "builder-settings-types";

export const settings = new SettingGroup({
  title: "Settings",
  main: true,
  settings: {
    leaderboard: new SettingGroup({
      title: "Leaderboard",
      settings: {
        test: new StringSetting({
          title: "Test",
          default: "test",
        }),
        background: new ColorSetting({
          default: "255,255,255",
          title: "background",
        }),
        width: new WidthSetting({
          default: 860,
          mobile: 370,
          title: "width",
        }),
        opacity: new OpacitySetting({
          default: 100,
        }),
        border: new BorderSettingSet({}),
      },
    }),
  },
});

export type Settings = SettingsToProps<typeof settings>;

export default settings;
