import {
  BorderSettingSet,
  ColorSetting,
  OpacitySetting,
  SettingGroup,
  StringSetting,
  WidthSetting,
  type SettingsToProps,
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
          mobile: 270,
          title: "width",
        }),
        fontSize: new WidthSetting({
          default: 16,
          mobile: 14,
          title: "Font Size",
        }),
        padding: new WidthSetting({
          default: 20,
          mobile: 12,
          title: "Padding",
        }),
        opacity: new OpacitySetting({
          default: 100,
        }),
        border: new BorderSettingSet({}),
      },
    }),
  },
});

// settings.setJson(JSON.stringify(template));

export type Settings = SettingsToProps<typeof settings>;

export default settings;
